import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

function loadTypeScriptModule(filePath) {
  const absolutePath = resolve(filePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;
  const module = { exports: {} };
  moduleCache.set(absolutePath, module);
  const source = readFileSync(absolutePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: absolutePath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  });
  const localRequire = (specifier) => {
    if (!specifier.startsWith(".")) return nativeRequire(specifier);
    const candidate = resolve(dirname(absolutePath), specifier);
    return loadTypeScriptModule(/\.[cm]?[jt]s$/.test(candidate) ? candidate : `${candidate}.ts`);
  };
  const execute = new Function("require", "module", "exports", "__filename", "__dirname", outputText);
  execute(localRequire, module, module.exports, absolutePath, dirname(absolutePath));
  return module.exports;
}

const {
  FLOW_MOTION_PROVIDER_TARGET,
  buildFlowMotionPrompt,
  buildFlowMotionState,
  flowMotionStateIsValid,
  transitionFlowMotionJob,
  flowMotionUnknownCreditNoResultCanReopen,
} = loadTypeScriptModule(new URL("../lib/flow-motion-jobs.ts", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1"));

const { VEO_SCENE_SELECTION_CONTRACT_VERSION } = loadTypeScriptModule(
  new URL("../lib/veo-scene-selector.ts", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1"),
);

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const hashC = "c".repeat(64);
const generatedAt = "2026-07-15T01:02:03.000Z";
const outputRoot = "C:\\tmp\\money-shorts-os\\flow-test-topic\\real\\flow-motion-v1";
const scenes = [
  {
    sceneNumber: 1,
    sceneId: "scene-01",
    sceneLabel: "금액 비교",
    narration: "두 금액을 차분히 비교한다.",
    visualCue: "밝은 거실의 정적인 금액 비교",
    mediaStrategy: "still",
    mediaStrategyContractVersion: VEO_SCENE_SELECTION_CONTRACT_VERSION,
    referenceFile: "C:\\tmp\\money-shorts-os\\flow-test-topic\\scene-01.png",
    referenceSha256: hashA,
  },
  {
    sceneNumber: 2,
    sceneId: "scene-02",
    sceneLabel: "민재의 자동이체 변경",
    narration: "민재가 자동이체 순서를 바꾼다.",
    visualCue: "민재의 손이 생활비 카드보다 저축 카드를 먼저 놓는다.",
    visibleAction: "민재가 저축 카드를 집어 생활비 카드 앞에 내려놓는다.",
    motionPlan: "시선이 카드로 이동하고 오른손이 카드 한 장을 집어 옮긴 뒤 멈춘다.",
    mediaStrategy: "veo_motion",
    mediaStrategyContractVersion: VEO_SCENE_SELECTION_CONTRACT_VERSION,
    referenceFile: "C:\\tmp\\money-shorts-os\\flow-test-topic\\scene-02.png",
    referenceSha256: hashB,
  },
];

const build = (previous = null) => buildFlowMotionState({
  topicId: "flow-test-topic",
  productionPartId: "single",
  scriptFingerprint: "script-fingerprint-v1",
  outputRoot,
  scenes,
  generatedAt,
  previous,
});

check("provider is fixed to Gemini 2, Veo Fast, 9:16, one output", () => {
  assert.equal(FLOW_MOTION_PROVIDER_TARGET.primaryProfile, "Gemini 2");
  assert.equal(FLOW_MOTION_PROVIDER_TARGET.videoModel, "Veo 3.1 - Fast");
  assert.equal(FLOW_MOTION_PROVIDER_TARGET.aspectRatio, "9:16");
  assert.equal(FLOW_MOTION_PROVIDER_TARGET.outputCount, 1);
});

check("fallback is permitted only after explicit quota exhaustion", () => {
  assert.deepEqual(FLOW_MOTION_PROVIDER_TARGET.fallbackProfiles, ["Gemini 3", "Gemini 4"]);
  assert.equal(FLOW_MOTION_PROVIDER_TARGET.fallbackCondition, "explicit_quota_exhausted_only");
});

check("only automatically selected Veo scenes become jobs", () => {
  const state = build();
  assert.equal(state.requiredSceneCount, 1);
  assert.equal(state.jobs[0].sceneNumber, 2);
  assert.equal(state.overallStatus, "approval_pending");
});

check("fresh packets preserve a strict no-submit boundary", () => {
  const state = build();
  assert.deepEqual(state.noSubmitBoundary, {
    scope: "packet_preparation_only",
    externalActionPerformed: false,
    browserOpened: false,
    uploadCount: 0,
    promptSubmitCount: 0,
    generationSubmitCount: 0,
    creditsSpent: 0,
  });
  assert.equal(state.jobs[0].liveBoundary.generationSubmittedNow, false);
  assert.equal(state.jobs[0].liveBoundary.creditsSpentNow, false);
});

check("tampered live-boundary state is rejected", () => {
  const state = build();
  const tampered = {
    ...state,
    noSubmitBoundary: { ...state.noSubmitBoundary, generationSubmitCount: 1 },
  };
  assert.equal(flowMotionStateIsValid(tampered), false);
});

check("motion prompt requires articulation and rejects camera-only motion", () => {
  const prompt = buildFlowMotionPrompt(scenes[1]);
  assert.match(prompt, /true restrained articulated character/);
  assert.match(prompt, /camera drift, zoom, parallax[\s\S]*alone is not sufficient/);
});

check("motion prompt preserves the bright warm non-photoreal visual contract", () => {
  const prompt = buildFlowMotionPrompt(scenes[1]);
  assert.match(prompt, /non-photoreal family-feature-quality cinematic 3D/);
  assert.match(prompt, /bright warm palette/);
  assert.match(prompt, /No readable text[\s\S]*laboratory, vault, factory, machine room/);
});

check("object-only reference images cannot become Flow generation jobs", () => {
  const objectOnlyScenes = structuredClone(scenes);
  objectOnlyScenes[1].presenceMode = "none";
  objectOnlyScenes[1].visualModeId = "OBJECT_MECHANISM";
  assert.throws(() => buildFlowMotionState({
    topicId: "flow-test-topic",
    productionPartId: "single",
    scriptFingerprint: "script-fingerprint-v1",
    outputRoot,
    scenes: objectOnlyScenes,
    generatedAt,
  }), /flow_motion_object_only_scene_forbidden:2/);
});

check("packet hashes and approval wording are deterministic", () => {
  const left = build();
  const right = build();
  assert.equal(left.jobs[0].promptSha256, right.jobs[0].promptSha256);
  assert.equal(left.jobs[0].referenceSha256, hashB);
  assert.match(left.jobs[0].approval.requiredWording, /APPROVE_FLOW_MOTION_GENERATION:/);
  assert.match(left.jobs[0].approval.requiredWording, new RegExp(left.jobs[0].promptSha256));
  assert.match(left.jobs[0].approval.requiredWording, /quota_exhausted/);
});

check("a changed reference gets a new content-addressed output path while the prior contract path is preserved", () => {
  const previous = build();
  const changedScenes = structuredClone(scenes);
  changedScenes[1].referenceSha256 = hashC;
  const next = buildFlowMotionState({
    topicId: "flow-test-topic",
    productionPartId: "single",
    scriptFingerprint: "script-fingerprint-v1",
    outputRoot,
    scenes: changedScenes,
    generatedAt,
    previous,
  });
  assert.notEqual(next.jobs[0].expectedVideoPath, previous.jobs[0].expectedVideoPath);
  assert.match(next.jobs[0].expectedVideoPath, /contract-c{16}-[a-f0-9]{16}/i);
  assert.equal(build(previous).jobs[0].expectedVideoPath, previous.jobs[0].expectedVideoPath);
});

check("an unchanged packet preserves prior state", () => {
  const approved = transitionFlowMotionJob(build(), "flow-test-topic-single-scene-02", {
    to: "generating",
    at: "2026-07-15T01:03:00.000Z",
    ownerApprovalId: "owner-approval-001",
  });
  const rebuilt = build(approved);
  assert.equal(rebuilt.jobs[0].status, "generating");
  assert.equal(rebuilt.jobs[0].approval.ownerApprovalId, "owner-approval-001");
});

check("generation cannot start without exact owner approval evidence", () => {
  assert.throws(
    () => transitionFlowMotionJob(build(), "flow-test-topic-single-scene-02", { to: "generating", at: generatedAt }),
    /flow_motion_owner_approval_required/,
  );
});

check("approved generation records approval id and timestamp", () => {
  const state = transitionFlowMotionJob(build(), "flow-test-topic-single-scene-02", {
    to: "generating",
    at: "2026-07-15T01:03:00.000Z",
    ownerApprovalId: "owner-approval-001",
  });
  assert.equal(state.overallStatus, "generating");
  assert.equal(state.jobs[0].approval.ownerApprovalId, "owner-approval-001");
});

check("QA pending requires the generated video hash", () => {
  const generating = transitionFlowMotionJob(build(), "flow-test-topic-single-scene-02", {
    to: "generating",
    at: "2026-07-15T01:03:00.000Z",
    ownerApprovalId: "owner-approval-001",
  });
  assert.throws(
    () => transitionFlowMotionJob(generating, generating.jobs[0].jobId, { to: "qa_pending", at: generatedAt }),
    /flow_motion_output_hash_required/,
  );
});

check("QA pass requires Owner QA evidence", () => {
  const generating = transitionFlowMotionJob(build(), "flow-test-topic-single-scene-02", {
    to: "generating",
    at: "2026-07-15T01:03:00.000Z",
    ownerApprovalId: "owner-approval-001",
  });
  const qaPending = transitionFlowMotionJob(generating, generating.jobs[0].jobId, {
    to: "qa_pending",
    at: "2026-07-15T01:04:00.000Z",
    outputVideoSha256: "c".repeat(64),
  });
  assert.throws(
    () => transitionFlowMotionJob(qaPending, qaPending.jobs[0].jobId, { to: "qa_pass", at: generatedAt }),
    /flow_motion_qa_evidence_required/,
  );
});

check("the complete approved QA path reaches render-ready", () => {
  const generating = transitionFlowMotionJob(build(), "flow-test-topic-single-scene-02", {
    to: "generating",
    at: "2026-07-15T01:03:00.000Z",
    ownerApprovalId: "owner-approval-001",
  });
  const qaPending = transitionFlowMotionJob(generating, generating.jobs[0].jobId, {
    to: "qa_pending",
    at: "2026-07-15T01:04:00.000Z",
    outputVideoSha256: "c".repeat(64),
  });
  const qaPass = transitionFlowMotionJob(qaPending, qaPending.jobs[0].jobId, {
    to: "qa_pass",
    at: "2026-07-15T01:05:00.000Z",
    qaEvidenceId: "visual-qa-001",
  });
  const ready = transitionFlowMotionJob(qaPass, qaPass.jobs[0].jobId, {
    to: "render_ready",
    at: "2026-07-15T01:05:30.000Z",
  });
  assert.equal(ready.overallStatus, "render_ready");
  assert.equal(ready.renderReadyCount, 1);
  assert.equal(flowMotionStateIsValid(ready), true);
});

check("forbidden state skips fail closed", () => {
  assert.throws(
    () => transitionFlowMotionJob(build(), "flow-test-topic-single-scene-02", {
      to: "render_ready",
      at: generatedAt,
      qaEvidenceId: "fake-evidence",
    }),
    /flow_motion_transition_forbidden/,
  );
});

check("output state cannot escape the local money-shorts root", () => {
  assert.throws(
    () => buildFlowMotionState({
      topicId: "escape",
      productionPartId: "single",
      scriptFingerprint: "x",
      outputRoot: "C:\\Users\\PC\\Desktop\\escape",
      scenes,
      generatedAt,
    }),
    /flow_motion_output_root_forbidden/,
  );
});

const helperSource = readFileSync(new URL("../lib/owner-web-operator.ts", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../app/api/money-shorts/operator/route.ts", import.meta.url), "utf8");
const wizardSource = readFileSync(new URL("../components/VideoCreationWizard.tsx", import.meta.url), "utf8");
const jobSource = readFileSync(new URL("../lib/flow-motion-jobs.ts", import.meta.url), "utf8");
const runnerSource = readFileSync(new URL("./run-flow-motion-job-playwright-v1.mjs", import.meta.url), "utf8");

check("operator exposes packet preparation as a no-script local action", () => {
  assert.match(helperSource, /flowMotionPrepare/);
  assert.match(routeSource, /prepareWizardFlowMotionPackets/);
  assert.match(routeSource, /생성 전송·크레딧 사용은 0회/);
  assert.match(helperSource, /scene-images-summary\.json/);
  assert.match(helperSource, /flow_motion_presence_contract_missing/);
  assert.match(helperSource, /flow_motion_image_summary_hash_mismatch/);
  assert.match(helperSource, /presenceMode:/);
  assert.match(helperSource, /scene\.mediaStrategy === "veo_motion" && presenceMode === "none"[\s\S]*\? "still"/);
});

check("wizard shows packet state without claiming that Flow generated a clip", () => {
  assert.match(wizardSource, /title="Veo 모션 준비"/);
  assert.match(wizardSource, /wizard-action-flow-motion-prepare/);
  assert.match(wizardSource, /브라우저를 열거나 크레딧을 사용하지 않습니다/);
  assert.match(wizardSource, /wizard-flow-motion-preview-[\s\S]*muted/);
  assert.match(wizardSource, /Veo 원본 오디오는 검수·최종 영상에 사용하지 않습니다/);
  assert.match(wizardSource, /인물·손이 없는 이미지는 Veo 생성 대상에서 자동 제외됩니다/);
});

check("operator connects exact approval, one live runner and Owner QA actions", () => {
  assert.match(helperSource, /flowMotionGenerate/);
  assert.match(helperSource, /flowMotionRecover/);
  assert.match(routeSource, /authorizeWizardFlowMotionGeneration/);
  assert.match(routeSource, /authorizeWizardFlowMotionResultRecovery/);
  assert.match(routeSource, /ALLOW_FLOW_MOTION_GENERATION/);
  assert.match(routeSource, /passWizardFlowMotionOwnerQa/);
  assert.match(routeSource, /failWizardFlowMotionOwnerQa/);
});

check("paid Flow result recovery is download-only and evidence-bound", () => {
  assert.match(helperSource, /FLOW_MOTION_RESULT_RECOVERY_CONFIRM_TEXT = "기존결과복구"/);
  assert.match(helperSource, /FLOW_MOTION_RESUMABLE_SUMMARY_STATUSES/);
  assert.match(helperSource, /SUBMITTED_RESULT_BOUND_PENDING_DOWNLOAD/);
  assert.match(helperSource, /flowMotionResultBindingIsExact/);
  assert.match(helperSource, /money_shorts_flow_motion_result_binding_v1/);
  assert.match(helperSource, /flow_motion_recovery_evidence_invalid/);
  assert.match(helperSource, /Owner approved download-only recovery of an existing paid Flow result; no new generation submission/);
  assert.match(routeSource, /action === "flowMotionGenerate" \|\| action === "flowMotionRecover"/);
  assert.match(routeSource, /const media = recoveryOnly \? null : readWizardRealMediaState/);
  assert.match(helperSource, /ownerObservedSubmissionCount/);
  assert.match(wizardSource, /Owner 확인 누적 전송/);
  assert.match(wizardSource, /추가 생성 없이 기존 영상 저장 복구/);
  assert.match(helperSource, /resultRecoveryAvailable/);
  assert.match(wizardSource, /job\.resultRecoveryAvailable/);
  assert.match(helperSource, /flowMotionSubmissionEvidenceIsReliable/);
  assert.match(helperSource, /flowMotionUncertainResultRecoveryIsExact/);
  assert.match(helperSource, /exact_attempt_result_recovered_after_uncertain_click/);
  assert.match(helperSource, /--recover-existing-only/);
  assert.match(runnerSource, /recoverExistingOnly/);
  assert.match(runnerSource, /recovery_only_requires_existing_attempt/);
  assert.match(wizardSource, /새 생성 없이 기존 결과 확인·복구/);
  assert.doesNotMatch(wizardSource, /\(job\.status === "approval_pending" \|\| job\.status === "qa_failed"\)/);
});

check("saved paid Flow output reconnects to QA before any recovery runner", () => {
  const flowBranchStart = routeSource.indexOf('if (action === "flowMotionGenerate" || action === "flowMotionRecover")');
  const flowBranchEnd = routeSource.indexOf('if (action === "flowMotionQaPass")', flowBranchStart);
  assert.ok(flowBranchStart >= 0 && flowBranchEnd > flowBranchStart);
  const flowRouteBranch = routeSource.slice(flowBranchStart, flowBranchEnd);
  const authorizedIndex = flowRouteBranch.indexOf("const authorized =");
  const runnerIndex = flowRouteBranch.indexOf("await runOperatorScriptAsync");
  const firstRecordIndex = flowRouteBranch.indexOf("recordWizardFlowMotionGenerationResult(topicId, jobId)");
  assert.ok(firstRecordIndex >= 0 && firstRecordIndex < authorizedIndex && authorizedIndex < runnerIndex);
  const preAuthorizationRecovery = flowRouteBranch.slice(0, authorizedIndex);
  assert.match(preAuthorizationRecovery, /if \(recoveryOnly(?: && [^)]+)?\)[\s\S]*recordWizardFlowMotionGenerationResult\(topicId, jobId\)/);

  const recordStart = helperSource.indexOf("export function recordWizardFlowMotionGenerationResult");
  const recordEnd = helperSource.indexOf("export function markWizardFlowMotionGenerationFailed", recordStart);
  assert.ok(recordStart >= 0 && recordEnd > recordStart);
  const recordSource = helperSource.slice(recordStart, recordEnd);
  assert.match(recordSource, /existsSync\(target\.job\.expectedVideoPath\)/);
  assert.match(recordSource, /flowMotionSavedOutputFinalizationIsExact\(summary, target\.job\)/);
  assert.match(recordSource, /target\.job\.status !== "generating" && target\.job\.status !== "qa_pending"/);
  assert.match(recordSource, /const alreadyRecorded = target\.job\.qa\.outputVideoSha256 === outputVideoSha256/);
  assert.match(recordSource, /flow_motion_qa_pending_result_mismatch/);
  assert.match(recordSource, /to: "qa_pending"/);
  const qaPendingIdempotenceStart = recordSource.indexOf('if (target.job.status === "qa_pending")');
  const qaPendingIdempotenceEnd = recordSource.indexOf("const at =", qaPendingIdempotenceStart);
  assert.ok(qaPendingIdempotenceStart >= 0 && qaPendingIdempotenceEnd > qaPendingIdempotenceStart);
  const qaPendingIdempotenceSource = recordSource.slice(qaPendingIdempotenceStart, qaPendingIdempotenceEnd);
  assert.match(qaPendingIdempotenceSource, /target\.job\.execution\.status === "downloaded"/);
  assert.match(qaPendingIdempotenceSource, /target\.job\.execution\.selectedProfile === summary\?\.selectedProfile/);
  assert.match(qaPendingIdempotenceSource, /resolve\(String\(target\.job\.execution\.summaryPath \?\? ""\)\) === resolve\(summaryPath\)/);
  assert.match(qaPendingIdempotenceSource, /\? \{ ok: true, status: readWizardFlowMotionStatus\(topicId\) \}/);
  assert.doesNotMatch(qaPendingIdempotenceSource, /writeWizardFlowMotionStateAtomic|transitionFlowMotionJob/);

  const savedOutputCheckStart = helperSource.indexOf("function flowMotionSavedOutputFinalizationIsExact");
  const savedOutputCheckEnd = helperSource.indexOf("function flowMotionUncertainResultRecoveryIsExact", savedOutputCheckStart);
  assert.ok(savedOutputCheckStart >= 0 && savedOutputCheckEnd > savedOutputCheckStart);
  const savedOutputCheckSource = helperSource.slice(savedOutputCheckStart, savedOutputCheckEnd);
  assert.match(savedOutputCheckSource, /summary\.status === "OWNER_QA_REQUIRED"/);
  assert.match(savedOutputCheckSource, /flowMotionAttemptIdentityIsExact\(summary, job\)/);
  assert.match(savedOutputCheckSource, /flowMotionResultBindingIsExact\(summary, job\)/);
  assert.match(savedOutputCheckSource, /flowMotionSubmissionEvidenceIsReliable\(summary, job\.providerTarget\.expectedCreditsPerGeneration, job\)/);
  assert.match(savedOutputCheckSource, /summary\.outputVideoSha256 === outputVideoSha256/);
  assert.match(savedOutputCheckSource, /summary\.probe\?\.audioStreamCount\) === 0/);

  const failedFinalizationStart = helperSource.indexOf("function flowMotionFailedAfterRunnerFinalization");
  const failedFinalizationEnd = helperSource.indexOf("function flowMotionUncertainResultRecoveryIsExact", failedFinalizationStart);
  assert.ok(failedFinalizationStart >= 0 && failedFinalizationEnd > failedFinalizationStart);
  const failedFinalizationSource = helperSource.slice(failedFinalizationStart, failedFinalizationEnd);
  assert.match(failedFinalizationSource, /job\.transitionHistory\.at\(-1\)/);
  assert.match(failedFinalizationSource, /latestTransition\?\.from === "generating"/);
  assert.match(failedFinalizationSource, /latestTransition\.to === "qa_failed"/);
  assert.doesNotMatch(failedFinalizationSource, /qa_pending|\.some\(/);
  assert.match(recordSource, /const recoverableFailedFinalization = flowMotionFailedAfterRunnerFinalization\(target\.job\)/);
  assert.match(recordSource, /target\.job\.status !== "generating" && target\.job\.status !== "qa_pending" && !recoverableFailedFinalization/);
});

check("public recovery availability includes exact generating saved-output states", () => {
  const publicJobsStart = helperSource.indexOf("const publicJobs =");
  const publicRecoveryStart = helperSource.indexOf("const outputExists = existsSync(job.expectedVideoPath)", publicJobsStart);
  const publicRecoveryEnd = helperSource.indexOf("const newAttemptReopenAvailable", publicRecoveryStart);
  assert.ok(publicRecoveryStart >= 0 && publicRecoveryEnd > publicRecoveryStart);
  const publicRecoverySource = helperSource.slice(publicRecoveryStart, publicRecoveryEnd);
  assert.match(publicRecoverySource, /job\.status === "generating"/);
  assert.match(publicRecoverySource, /existsSync\(job\.expectedVideoPath\)/);
  assert.match(publicRecoverySource, /flowMotionKnownResultRecoveryIsExact\(summary, job\)/);
  assert.match(publicRecoverySource, /flowMotionUncertainResultRecoveryIsExact\(summary, job\)/);
  assert.match(publicRecoverySource, /flowMotionResultBindingIsExact\(summary, job\)/);
  assert.match(publicRecoverySource, /flowMotionSavedOutputFinalizationIsExact\(summary, job\)|summary\?\.status === "OWNER_QA_REQUIRED"/);
  assert.match(publicRecoverySource, /const interruptedGeneratingRecoveryAvailable =[\s\S]*job\.status === "generating" &&[\s\S]*!outputExists &&[\s\S]*\(knownResultRecoveryIsExact \|\| uncertainResultRecoveryIsExact\)/);
  assert.match(publicRecoverySource, /const failedBoundOutputRecoveryAvailable =[\s\S]*job\.status === "qa_failed" &&[\s\S]*exactBoundOutputExists/);
  assert.match(publicRecoverySource, /const failedSavedOutputFinalizationAvailable =[\s\S]*flowMotionFailedAfterRunnerFinalization\(job\) &&[\s\S]*outputExists &&[\s\S]*flowMotionSavedOutputFinalizationIsExact\(summary, job\)/);
  assert.match(publicRecoverySource, /resultRecoveryAvailable = !unknownCreditNewAttemptReopenAvailable && \([\s\S]*resumableResultRecoveryAvailable \|\|[\s\S]*failedBoundOutputRecoveryAvailable \|\|[\s\S]*failedSavedOutputFinalizationAvailable \|\|[\s\S]*existingOutputFinalizationAvailable \|\|[\s\S]*interruptedGeneratingRecoveryAvailable/);
});

check("generating recovery authorization resumes exact attempts in place without rewriting authorization", () => {
  const authorizerStart = helperSource.indexOf("export function authorizeWizardFlowMotionResultRecovery");
  const authorizerEnd = helperSource.indexOf("export function reopenWizardFlowMotionNewAttempt", authorizerStart);
  assert.ok(authorizerStart >= 0 && authorizerEnd > authorizerStart);
  const authorizerSource = helperSource.slice(authorizerStart, authorizerEnd);
  assert.match(authorizerSource, /target\.job\.status !== "qa_failed" && target\.job\.status !== "generating"/);
  assert.match(authorizerSource, /const existingBoundOutput = outputExists &&[\s\S]*knownSubmittedResult &&[\s\S]*summary\?\.resultBinding != null &&[\s\S]*flowMotionResultBindingIsExact\(summary, target\.job\)/);
  assert.match(authorizerSource, /if \(target\.job\.status === "generating"\) \{[\s\S]*const existingAttemptCanResume = outputExists[\s\S]*\? existingBoundOutput[\s\S]*: knownSubmittedResult \|\| uncertainAttemptResult/);
  assert.match(authorizerSource, /\{ ok: true, status: readWizardFlowMotionStatus\(topicId\), authorizationChanged: false \}/);
  assert.match(authorizerSource, /authorizationChanged: true/);
  assert.match(authorizerSource, /flow_motion_recovery_generating_state_invalid/);
});

check("global Flow lease conflicts preserve authorization without overwriting attempt evidence", () => {
  assert.match(runnerSource, /EXECUTION_LOCK_BLOCKED_NO_BROWSER/);
  assert.match(runnerSource, /browserAccessed: false/);
  assert.ok(runnerSource.indexOf("await acquireFlowMotionExecutionLock") < runnerSource.indexOf("const priorSummary ="));
  assert.match(routeSource, /rollbackWizardFlowMotionAuthorizationWithoutExecution/);
  assert.match(routeSource, /const authorizationChanged = "authorizationChanged" in authorized/);
  assert.match(routeSource, /\? authorized\.authorizationChanged[\s\S]*: true/);
  assert.match(routeSource, /const executionLockBlockedNoBrowser =[\s\S]*runnerStatus === "EXECUTION_LOCK_BLOCKED_NO_BROWSER"[\s\S]*run\.json\.browserAccessed === false[\s\S]*noFlowSubmission/);
  const lockBranchStart = routeSource.indexOf("if (executionLockBlockedNoBrowser)");
  const lockBranchEnd = routeSource.indexOf("if (!authorizationChanged)", lockBranchStart);
  assert.ok(lockBranchStart >= 0 && lockBranchEnd > lockBranchStart);
  const lockBranchSource = routeSource.slice(lockBranchStart, lockBranchEnd);
  assert.match(lockBranchSource, /const rolledBack = \{ ok: true as const, status: readWizardFlowMotionStatus\(topicId\) \}/);
  assert.doesNotMatch(lockBranchSource, /rollbackWizardFlowMotionAuthorizationWithoutExecution/);
  const finalizeAfterFailureIndex = routeSource.indexOf("const finalizedAfterRunnerFailure = recordWizardFlowMotionGenerationResult(topicId, jobId)");
  const preserveUnchangedIndex = routeSource.indexOf("if (!authorizationChanged)", finalizeAfterFailureIndex);
  const markFailedIndex = routeSource.indexOf("const failed = markWizardFlowMotionGenerationFailed", preserveUnchangedIndex);
  assert.ok(finalizeAfterFailureIndex >= 0 && preserveUnchangedIndex > finalizeAfterFailureIndex && markFailedIndex > preserveUnchangedIndex);
  assert.match(routeSource.slice(preserveUnchangedIndex, markFailedIndex), /readWizardFlowMotionStatus\(topicId\)/);
  assert.match(routeSource, /recoveryOnly \? "recovery" : "generation"/);
  assert.match(helperSource, /mode: "generation" \| "recovery"/);
  assert.match(helperSource, /const restored = mode === "generation"/);
  assert.match(routeSource, /FLOW_MOTION_GENERATION_TIMEOUT_MS = 1_500_000/);
});

check("a pre-run crash resumes only an exact zero-submit authorized generation", () => {
  const resumeHelperStart = helperSource.indexOf("function flowMotionUnstartedAuthorizedAttemptCanResume");
  const resumeHelperEnd = helperSource.indexOf("function flowMotionUncertainResultRecoveryIsExact", resumeHelperStart);
  assert.ok(resumeHelperStart >= 0 && resumeHelperEnd > resumeHelperStart);
  const resumeHelperSource = helperSource.slice(resumeHelperStart, resumeHelperEnd);
  assert.match(resumeHelperSource, /job\.status !== "generating"/);
  assert.match(resumeHelperSource, /job\.execution\.status !== "authorized"/);
  assert.match(resumeHelperSource, /job\.execution\.selectedProfile !== null/);
  assert.match(resumeHelperSource, /job\.execution\.submissionCount !== 0/);
  assert.match(resumeHelperSource, /job\.execution\.expectedCreditsSpent !== 0/);
  assert.match(resumeHelperSource, /job\.execution\.summaryPath !== null/);
  assert.match(resumeHelperSource, /if \(!summaryFileExists\) return true/);
  assert.match(resumeHelperSource, /"FAILED_NO_AUTOMATIC_RETRY", "CONFIRMATION_PENDING_NO_SUBMISSION"/);
  assert.match(resumeHelperSource, /summary\.approvalClickAttemptCount !== 0/);
  assert.match(resumeHelperSource, /ownerObservedSubmissionCount/);
  assert.match(resumeHelperSource, /ownerObservedCreditsSpent/);
  assert.match(resumeHelperSource, /flowMotionApprovalClickRequiresManualReview\(summary, true\)/);
  assert.match(resumeHelperSource, /Number\.isInteger\(summary\.makeClickAttemptCount\)/);
  assert.match(resumeHelperSource, /summary\.makeClickIntent\?\.clickIntentArmed === true/);
  assert.match(resumeHelperSource, /summary\.status === "CONFIRMATION_PENDING_NO_SUBMISSION"[\s\S]*\? confirmedNoSubmission/);

  const generationAuthorizerStart = helperSource.indexOf("export function authorizeWizardFlowMotionGeneration");
  const generationAuthorizerEnd = helperSource.indexOf("export function rollbackWizardFlowMotionAuthorizationWithoutExecution", generationAuthorizerStart);
  const generationAuthorizerSource = helperSource.slice(generationAuthorizerStart, generationAuthorizerEnd);
  assert.match(generationAuthorizerSource, /target\.job\.status !== "approval_pending" && target\.job\.status !== "qa_failed" && target\.job\.status !== "generating"/);
  assert.match(generationAuthorizerSource, /flowMotionUnstartedAuthorizedAttemptCanResume\(priorSummary, priorSummaryExists, target\.job\)/);
  assert.match(generationAuthorizerSource, /flow_motion_generating_attempt_not_safe_to_resume/);
  assert.match(generationAuthorizerSource, /authorizationChanged: false/);
  assert.match(wizardSource, /job\.status === "approval_pending" \|\| job\.generationResumeAvailable/);
  assert.match(wizardSource, /이전 실행은 유료 생성 클릭 전에 중단됐습니다/);
});

check("QA rejection and legacy lazy-link false positives reopen only a fresh approved attempt", () => {
  assert.match(helperSource, /FLOW_MOTION_NEW_ATTEMPT_CONFIRM_TEXT = "새생성열기"/);
  assert.match(helperSource, /new_flow_edit_result_after_make_without_confirmation/);
  assert.match(helperSource, /reopened-\$\{stamp\}\.generation-summary\.json/);
  assert.match(helperSource, /rejected-\$\{stamp\}\.generation-summary\.json/);
  assert.match(helperSource, /newAttemptReopenAvailable/);
  assert.match(routeSource, /action === "flowMotionReopenNewAttempt"/);
  assert.match(wizardSource, /wizard-action-flow-motion-reopen/);
  assert.match(wizardSource, /이 버튼은 Flow를 실행하지 않으며 크레딧을 사용하지 않습니다/);
});

check("unknown-credit attempt reopens only after exact no-result recovery timeout", () => {
  const transitionHistory = [
    { from: "approval_pending", to: "generating", at: "2026-07-22T19:54:31.112Z", evidenceId: "owner-recovery-example" },
    { from: "generating", to: "qa_failed", at: "2026-07-22T20:04:36.724Z", evidenceId: null },
  ];
  const candidate = {
    jobStatus: "qa_failed",
    outputExists: false,
    exactUncertainAttempt: true,
    summaryStatus: "MAKE_CLICK_OUTCOME_UNKNOWN",
    summaryFailure: "flow_result_binding_timeout_no_search",
    profileAttempts: [{ profileId: 2, state: "selected_resume_download" }],
    transitionHistory,
  };
  assert.equal(flowMotionUnknownCreditNoResultCanReopen(candidate), true);
  assert.equal(flowMotionUnknownCreditNoResultCanReopen({ ...candidate, outputExists: true }), false);
  assert.equal(flowMotionUnknownCreditNoResultCanReopen({ ...candidate, exactUncertainAttempt: false }), false);
  assert.equal(flowMotionUnknownCreditNoResultCanReopen({ ...candidate, profileAttempts: [{ profileId: 2, state: "selected" }] }), false);
  assert.equal(flowMotionUnknownCreditNoResultCanReopen({ ...candidate, transitionHistory: transitionHistory.slice(1) }), false);
});

check("unknown-credit no-result resolution is archived and remains no-live", () => {
  assert.match(helperSource, /FLOW_MOTION_UNKNOWN_CREDIT_NEW_ATTEMPT_CONFIRM_TEXT = "영상없음차감모름새생성열기"/);
  assert.match(helperSource, /video_missing_credit_usage_unknown_start_new_attempt/);
  assert.match(helperSource, /money_shorts_flow_motion_owner_resolution_v1/);
  assert.match(helperSource, /unknownCreditNewAttemptReopenAvailable/);
  assert.match(helperSource, /flow_motion_recovery_already_exhausted_no_result/);
  assert.match(helperSource, /const resultRecoveryAvailable = !unknownCreditNewAttemptReopenAvailable/);
  assert.match(wizardSource, /영상 없음·차감 모름 기록하고 새 생성 열기/);
  assert.match(wizardSource, /job\.resultRecoveryAvailable && !job\.unknownCreditNewAttemptReopenAvailable/);
  assert.match(routeSource, /영상 없음·크레딧 차감 여부 모름을 기록하고 새 생성 승인 대기 상태를 열었습니다/);
});

check("unknown approval-click outcome blocks reapproval and is explicit in the wizard", () => {
  const manualReviewGateIndex = helperSource.indexOf("flowMotionApprovalClickRequiresManualReview(priorSummary,");
  const ownerApprovalMatchIndex = helperSource.indexOf("ownerApproval !== target.job.approval.requiredWording", manualReviewGateIndex);
  assert.match(helperSource, /"MAKE_CLICK_OUTCOME_UNKNOWN", "APPROVAL_CLICK_OUTCOME_UNKNOWN"/);
  assert.match(helperSource, /required_generation_confirmation_dialog_missing/);
  assert.match(helperSource, /const confirmedNoSubmission = summary\.submissionCount === 0/);
  assert.match(helperSource, /!confirmedNoSubmission/);
  assert.match(helperSource, /summaryFileExists && summary === null/);
  assert.match(helperSource, /const priorSummaryExists = existsSync\(priorSummaryPath\)/);
  assert.match(helperSource, /flowMotionApprovalClickRequiresManualReview/);
  assert.match(helperSource, /flow_motion_prior_approval_click_outcome_requires_manual_review/);
  assert.match(helperSource, /creditUsageStatus/);
  assert.ok(manualReviewGateIndex >= 0 && ownerApprovalMatchIndex > manualReviewGateIndex);
  assert.match(wizardSource, /wizard-flow-motion-credit-review/);
  assert.match(wizardSource, /전송·크레딧 사용 여부를 수동 확인하기 전에는 새 생성을 진행할 수 없습니다/);
  assert.match(wizardSource, /job\.creditUsageStatus !== "unknown" && \(job\.status === "approval_pending" \|\| job\.generationResumeAvailable\)/);
  assert.doesNotMatch(wizardSource, /\{job\.status === "approval_pending" \|\| job\.status === "qa_failed" \?/);
});

check("wizard exposes exact approval entry, generated clip preview and seven-item QA", () => {
  assert.match(wizardSource, /wizard-action-flow-motion-generate/);
  assert.match(wizardSource, /wizard-action-flow-motion-approval-fill/);
  assert.match(wizardSource, /승인 문구만 자동 입력/);
  assert.match(wizardSource, /flowMotionApprovalInputs\[job\.jobId\].*\.trim\(\)/);
  assert.match(wizardSource, /video=flow-motion/);
  assert.match(wizardSource, /FLOW_MOTION_QA_ITEMS/);
  assert.match(wizardSource, /7항목 통과 · 렌더에 사용/);
});

check("live runner requires confirmation and forbids post-submit fallback", () => {
  assert.match(runnerSource, /required_generation_confirmation_dialog_missing/);
  assert.match(runnerSource, /generation_cost_or_output_facts_unconfirmed/);
  assert.match(runnerSource, /quota_exhausted_after_submission_no_fallback/);
  assert.match(runnerSource, /recordApprovalClickDispatched/);
  assert.match(runnerSource, /recordMakeClickIntentArmed/);
  assert.match(runnerSource, /waitForPostMakeOutcome/);
  assert.match(runnerSource, /exact_attempt_result_after_make_no_confirmation/);
  assert.match(runnerSource, /capturePostMakeFailureEvidence/);
  assert.match(runnerSource, /MAKE_CLICK_OUTCOME_UNKNOWN/);
  assert.match(runnerSource, /submissionCount = 1/);
});

check("state builder has no browser, upload or network execution dependency", () => {
  assert.doesNotMatch(jobSource, /from\s+["'](?:playwright|puppeteer|selenium)|fetch\s*\(|spawn\s*\(|execFile\s*\(/i);
});

console.log(`\nFlow motion job state: ${passed}/${passed} PASS`);
