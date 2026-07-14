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

check("packet hashes and approval wording are deterministic", () => {
  const left = build();
  const right = build();
  assert.equal(left.jobs[0].promptSha256, right.jobs[0].promptSha256);
  assert.equal(left.jobs[0].referenceSha256, hashB);
  assert.match(left.jobs[0].approval.requiredWording, /APPROVE_FLOW_MOTION_GENERATION:/);
  assert.match(left.jobs[0].approval.requiredWording, new RegExp(left.jobs[0].promptSha256));
  assert.match(left.jobs[0].approval.requiredWording, /quota_exhausted/);
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
});

check("wizard shows packet state without claiming that Flow generated a clip", () => {
  assert.match(wizardSource, /title="Veo 모션 준비"/);
  assert.match(wizardSource, /wizard-action-flow-motion-prepare/);
  assert.match(wizardSource, /브라우저를 열거나 크레딧을 사용하지 않습니다/);
});

check("operator connects exact approval, one live runner and Owner QA actions", () => {
  assert.match(helperSource, /flowMotionGenerate/);
  assert.match(routeSource, /authorizeWizardFlowMotionGeneration/);
  assert.match(routeSource, /ALLOW_FLOW_MOTION_GENERATION/);
  assert.match(routeSource, /passWizardFlowMotionOwnerQa/);
  assert.match(routeSource, /failWizardFlowMotionOwnerQa/);
});

check("wizard exposes exact approval entry, generated clip preview and seven-item QA", () => {
  assert.match(wizardSource, /wizard-action-flow-motion-generate/);
  assert.match(wizardSource, /video=flow-motion/);
  assert.match(wizardSource, /FLOW_MOTION_QA_ITEMS/);
  assert.match(wizardSource, /7항목 통과 · 렌더에 사용/);
});

check("live runner requires confirmation and forbids post-submit fallback", () => {
  assert.match(runnerSource, /required_generation_confirmation_dialog_missing/);
  assert.match(runnerSource, /generation_credit_cost_unconfirmed/);
  assert.match(runnerSource, /quota_exhausted_after_submission_no_fallback/);
  assert.match(runnerSource, /submissionCount:\s*1/);
});

check("state builder has no browser, upload or network execution dependency", () => {
  assert.doesNotMatch(jobSource, /from\s+["'](?:playwright|puppeteer|selenium)|fetch\s*\(|spawn\s*\(|execFile\s*\(/i);
});

console.log(`\nFlow motion job state: ${passed}/${passed} PASS`);
