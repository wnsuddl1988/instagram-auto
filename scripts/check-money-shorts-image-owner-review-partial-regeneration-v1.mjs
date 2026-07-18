#!/usr/bin/env node
/**
 * No-network contract check for Owner image review + exact selected-scene regeneration.
 * It exercises the pure hash/selection contract and statically locks the active UI/API/runner wiring.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  MONEY_SHORTS_MANUAL_VISUAL_REVIEW_APPROVAL_TEXT,
  MONEY_SHORTS_SELECTED_SCENE_REGENERATION_APPROVAL_TEXT,
  buildMoneyShortsManualVisualReviewEvidence,
  buildPendingManualVisualReviewState,
  commitMoneyShortsManualVisualReviewEvidenceTransaction,
  moneyShortsImageSetSha256,
  validateMoneyShortsImageReviewApproval,
  validateMoneyShortsManualVisualReview,
  validateMoneyShortsManualVisualReviewTransaction,
  validateMoneyShortsSelectedSceneRegeneration,
} from "../lib/money-shorts-manual-visual-review.mjs";

const ROOT = process.cwd();
const helper = readFileSync(path.join(ROOT, "lib", "owner-web-operator.ts"), "utf8");
const route = readFileSync(path.join(ROOT, "app", "api", "money-shorts", "operator", "route.ts"), "utf8");
const wizard = readFileSync(path.join(ROOT, "components", "VideoCreationWizard.tsx"), "utf8");
const runner = readFileSync(path.join(ROOT, "scripts", "run-owner-real-scene-images-from-wizard-script-once.mjs"), "utf8");
const videoRunner = readFileSync(path.join(ROOT, "scripts", "run-owner-real-video-from-wizard-assets-once.mjs"), "utf8");
const orchestrator = readFileSync(path.join(ROOT, "lib", "money-shorts-resumable-orchestrator.mjs"), "utf8");
const automationReadModel = readFileSync(path.join(ROOT, "lib", "money-shorts-automation-read-model.ts"), "utf8");
const flowJobs = readFileSync(path.join(ROOT, "lib", "flow-motion-jobs.ts"), "utf8");
const flowRunner = readFileSync(path.join(ROOT, "scripts", "run-flow-motion-job-playwright-v1.mjs"), "utf8");

let passed = 0;
let failed = 0;
function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

const sha = (digit) => String(digit).repeat(64);
const scene = (sceneIndex, digit) => ({
  sceneIndex,
  visualEvidenceId: `scene-${sceneIndex}`,
  promptFingerprint: String(digit).repeat(16),
  imageSha256: sha(digit),
});
const summary = {
  topicId: "finance-owner-image-review-contract",
  manualVisualReview: buildPendingManualVisualReviewState(),
  scenes: [scene(1, 1), scene(2, 2), scene(3, 3)],
};
const approvalTransactionId = sha("a");
const built = buildMoneyShortsManualVisualReviewEvidence({
  summary,
  approvalTransactionId,
  reviewedAt: "2026-07-18T01:02:03.000Z",
});
check("exact approval evidence builds from the current complete image set", built.ok === true);
const evidence = built.ok ? built.evidence : null;
check(
  "evidence is Owner-only and binds the computed image-set hash",
  evidence?.reviewerRole === "owner" &&
    evidence?.ownerApproval === true &&
    evidence?.approvalTransactionId === approvalTransactionId &&
    evidence?.imageSetSha256 === moneyShortsImageSetSha256(summary.scenes),
);
check(
  "current exact evidence passes manual visual review",
  validateMoneyShortsManualVisualReview({ summary, evidence }).passed === true,
);

const transactionFiles = new Map([
  ["part-1-review.json", "part-1-old"],
  ["part-2-review.json", "part-2-old"],
]);
let injectedSecondCommitFailure = false;
const failedTransaction = commitMoneyShortsManualVisualReviewEvidenceTransaction({
  approvalTransactionId: sha("b"),
  writes: [
    { path: "part-1-review.json", content: "part-1-new" },
    { path: "part-2-review.json", content: "part-2-new" },
  ],
  io: {
    exists: (filePath) => transactionFiles.has(filePath),
    writeText: (filePath, content) => transactionFiles.set(filePath, content),
    rename: (from, to) => {
      if (
        !injectedSecondCommitFailure &&
        from.endsWith(".tmp") &&
        to === "part-2-review.json"
      ) {
        injectedSecondCommitFailure = true;
        throw new Error("injected_second_part_commit_failure");
      }
      if (!transactionFiles.has(from) || transactionFiles.has(to)) {
        throw new Error("fake_rename_contract_failed");
      }
      transactionFiles.set(to, transactionFiles.get(from));
      transactionFiles.delete(from);
    },
  },
});
check(
  "second-part evidence commit failure rolls every active part back",
  failedTransaction.ok === false &&
    transactionFiles.get("part-1-review.json") === "part-1-old" &&
    transactionFiles.get("part-2-review.json") === "part-2-old",
);
check(
  "different valid part approval transactions fail the aggregate gate",
  validateMoneyShortsManualVisualReviewTransaction([
    { ready: true, approvalTransactionId: sha("a") },
    { ready: true, approvalTransactionId: sha("b") },
  ]).passed === false &&
    validateMoneyShortsManualVisualReviewTransaction([
      { ready: true, approvalTransactionId: sha("a") },
      { ready: true, approvalTransactionId: sha("b") },
    ]).reason === "MANUAL_VISUAL_REVIEW_TRANSACTION_MISMATCH",
);

for (const [label, mutate] of [
  ["image hash", (candidate) => { candidate.scenes[1].imageSha256 = sha(4); }],
  ["prompt fingerprint", (candidate) => { candidate.scenes[1].promptFingerprint = "5".repeat(16); }],
  ["visual evidence id", (candidate) => { candidate.scenes[1].visualEvidenceId = "scene-2-changed"; }],
]) {
  const changed = structuredClone(summary);
  mutate(changed);
  check(
    `${label} change invalidates the prior approval`,
    validateMoneyShortsManualVisualReview({ summary: changed, evidence }).passed === false,
  );
}

const part1Scenes = [
  { sceneIndex: 1, imageSha256: sha(1), ready: true },
  { sceneIndex: 2, imageSha256: sha(2), ready: true },
  { sceneIndex: 3, imageSha256: sha(3), ready: true },
];
const part2Scenes = [
  { sceneIndex: 1, imageSha256: sha(4), ready: true },
  { sceneIndex: 2, imageSha256: sha(5), ready: true },
];
const currentParts = [
  { partId: "part-1", imageSetSha256: sha("a"), scenes: part1Scenes },
  { partId: "part-2", imageSetSha256: sha("b"), scenes: part2Scenes },
];
const approval = validateMoneyShortsImageReviewApproval({
  currentParts,
  claims: [
    { partId: "part-1", imageSetSha256: sha("a") },
    { partId: "part-2", imageSetSha256: sha("b") },
  ],
  confirmReviewedAllImages: true,
  confirmVisualQualityAccepted: true,
  confirmDownstreamUse: true,
  approvalText: MONEY_SHORTS_MANUAL_VISUAL_REVIEW_APPROVAL_TEXT,
});
check("all-part UI hash claims and three confirmations pass", approval.ok === true);
check(
  "a stale all-part image-set claim is rejected",
  validateMoneyShortsImageReviewApproval({
    currentParts,
    claims: [
      { partId: "part-1", imageSetSha256: sha("c") },
      { partId: "part-2", imageSetSha256: sha("b") },
    ],
    confirmReviewedAllImages: true,
    confirmVisualQualityAccepted: true,
    confirmDownstreamUse: true,
    approvalText: MONEY_SHORTS_MANUAL_VISUAL_REVIEW_APPROVAL_TEXT,
  }).ok === false,
);

const selected = validateMoneyShortsSelectedSceneRegeneration({
  currentParts,
  selections: [
    { partId: "part-2", sceneIndex: 1, imageSha256: sha(4), imageSetSha256: sha("b") },
    { partId: "part-1", sceneIndex: 2, imageSha256: sha(2), imageSetSha256: sha("a") },
  ],
  confirmRegeneration: true,
  approvalText: MONEY_SHORTS_SELECTED_SCENE_REGENERATION_APPROVAL_TEXT,
});
check(
  "valid failed-scene selection produces exact part-scoped targets",
  selected.ok === true &&
    selected.selectedSceneCount === 2 &&
    selected.parts.length === 2 &&
    selected.parts[0].regenerateScenes.map((row) => row.sceneIndex).join(",") === "2" &&
    selected.parts[1].regenerateScenes.map((row) => row.sceneIndex).join(",") === "1",
);
check(
  "selection plan preserves every unselected scene hash byte-for-byte",
  selected.ok === true &&
    JSON.stringify(selected.parts[0].retainedScenes) === JSON.stringify([
      { sceneIndex: 1, imageSha256: sha(1) },
      { sceneIndex: 3, imageSha256: sha(3) },
    ]) &&
    JSON.stringify(selected.parts[1].retainedScenes) === JSON.stringify([
      { sceneIndex: 2, imageSha256: sha(5) },
    ]),
);

const invalidSelections = [
  { label: "empty", selections: [] },
  { label: "unknown part", selections: [{ partId: "single", sceneIndex: 1, imageSha256: sha(1), imageSetSha256: sha("a") }] },
  { label: "out of range", selections: [{ partId: "part-1", sceneIndex: 0, imageSha256: sha(1), imageSetSha256: sha("a") }] },
  { label: "stale image hash", selections: [{ partId: "part-1", sceneIndex: 1, imageSha256: sha(9), imageSetSha256: sha("a") }] },
  { label: "stale set hash", selections: [{ partId: "part-1", sceneIndex: 1, imageSha256: sha(1), imageSetSha256: sha("c") }] },
  {
    label: "duplicate target",
    selections: [
      { partId: "part-1", sceneIndex: 1, imageSha256: sha(1), imageSetSha256: sha("a") },
      { partId: "part-1", sceneIndex: 1, imageSha256: sha(1), imageSetSha256: sha("a") },
    ],
  },
];
for (const row of invalidSelections) {
  check(
    `${row.label} selection fails closed`,
    validateMoneyShortsSelectedSceneRegeneration({
      currentParts,
      selections: row.selections,
      confirmRegeneration: true,
      approvalText: MONEY_SHORTS_SELECTED_SCENE_REGENERATION_APPROVAL_TEXT,
    }).ok === false,
  );
}
check(
  "missing exact regeneration wording fails closed",
  validateMoneyShortsSelectedSceneRegeneration({
    currentParts,
    selections: [{ partId: "part-1", sceneIndex: 1, imageSha256: sha(1), imageSetSha256: sha("a") }],
    confirmRegeneration: true,
    approvalText: "",
  }).ok === false,
);

const partialStart = route.indexOf('if (action === "realSceneImagesRegenerateSelected")');
const partialEnd = route.indexOf("// 장면 이미지 만들기", partialStart);
const partialRoute = partialStart >= 0 && partialEnd > partialStart ? route.slice(partialStart, partialEnd) : "";
const acceptStart = route.indexOf('if (action === "realSceneImagesReviewAccept")');
const acceptEnd = route.indexOf("// Owner가 실패로", acceptStart);
const acceptRoute = acceptStart >= 0 && acceptEnd > acceptStart ? route.slice(acceptStart, acceptEnd) : "";
const createStart = route.indexOf('if (action === "realSceneImagesCreate")');
const createEnd = route.indexOf("// 최종 영상 만들기", createStart);
const createRoute = createStart >= 0 && createEnd > createStart ? route.slice(createStart, createEnd) : "";
check(
  "route validates exact selected claims before any runner spawn",
  partialRoute.indexOf("planWizardSelectedSceneImageRegeneration") >= 0 &&
    partialRoute.indexOf("planWizardSelectedSceneImageRegeneration") < partialRoute.indexOf("runOperatorScript"),
);
check(
  "empty or stale selection returns before command construction",
  /if \(!plan\.ok\)[\s\S]+return json/.test(partialRoute) &&
    partialRoute.indexOf("if (!plan.ok)") < partialRoute.indexOf("buildOperatorCommand"),
);
check(
  "Owner review acceptance performs no runner, network, browser, or generation marker",
  acceptRoute.includes("acceptWizardRealSceneImagesVisualQuality") &&
    !/runOperatorScript|\bfetch\s*\(|ALLOW_CHATGPT_IMAGE|playwright|chromium/.test(acceptRoute),
);
check(
  "multi-part initial generation skips already reviewable parts before command construction",
  createRoute.indexOf("partBefore?.realImages.reviewable === true") >= 0 &&
    createRoute.indexOf("partBefore?.realImages.reviewable === true") < createRoute.indexOf("buildOperatorCommand") &&
    createRoute.includes("if (mediaAfterImg.realImages.reviewable)"),
);
check(
  "selected command hardcodes exact targets, full-set hash, and no retry",
  helper.includes('"--regenerate-scenes"') &&
    helper.includes('"--owner-selected-scene-bindings"') &&
    helper.includes('"--expected-image-set-sha256"') &&
    helper.includes('"--exact-owner-selected-scenes"') &&
    helper.includes('"--no-retry"'),
);
check(
  "runner verifies complete current set and exact pending targets before Playwright import",
  runner.indexOf("completeCurrentSetReady") >= 0 &&
    runner.indexOf("exact Owner-selected regeneration must leave every and only the selected scenes pending") >= 0 &&
    runner.indexOf("completeCurrentSetReady") < runner.indexOf('await import("playwright")') &&
    runner.indexOf("exact Owner-selected regeneration must leave every and only the selected scenes pending") < runner.indexOf('await import("playwright")'),
);
check(
  "selected mode caps submissions to selected count and disables all recovery",
  /SUBMISSION_HARD_CAP\s*=\s*exactOwnerSelectedScenes[\s\S]+targetedRegenerationScenes\.length/.test(runner) &&
    /retryDisabled[\s\S]+noRetry/.test(runner) &&
    /ROUTING_RECOVERY_LIMIT_PER_SCENE\s*=\s*retryDisabled\s*\?\s*0/.test(runner),
);
check(
  "selected originals are content-addressed backups and unselected rows must remain ready",
  runner.includes("superseded-owner-review-v1") &&
    runner.includes("retainedScenesReady") &&
    runner.includes("Owner-selected scene ${sceneNumber} backup hash mismatch"),
);
check(
  "generic finance regeneration no longer injects old pilot scene-5/12 stories",
  !runner.includes("SCENE 5 EXACT CORRECTION") &&
    !runner.includes("SCENE 12 EXACT CORRECTION"),
);
check(
  "preview GET accepts only topic/part/scene/current hash and returns no raw path",
  route.includes('url.searchParams.get("image") === "scene"') &&
    route.includes("readWizardRealSceneImageBytes") &&
    route.includes('url.searchParams.get("sha256")') &&
    !partialRoute.includes('searchParams.get("path")'),
);
check(
  "preview helper re-hashes canonical C:\\tmp scene bytes",
    helper.includes("readWizardRealSceneImageBytes") &&
    helper.includes("wizardCanonicalSceneImagePath") &&
    helper.includes("resolve(scene.file) !== canonicalFile") &&
    helper.includes("scene-${String(sceneIndex).padStart(2, \"0\")}.png") &&
    helper.includes("imageSha256 === scene.imageSha256"),
);
check(
  "UI renders every part scene with current-hash preview and failed-scene checkbox",
  wizard.includes("wizard-real-scene-image-review-grid") &&
    wizard.includes("part.realImages.scenes.map") &&
    wizard.includes("image=scene") &&
    wizard.includes("wizard-select-failed-scene-"),
);
check(
  "late media responses from a previously selected topic cannot replace the current preview",
  wizard.includes("selectedTopicIdRef.current = selectedTopicId") &&
    wizard.includes("if (selectedTopicIdRef.current !== topicId) return;"),
);
check(
  "UI disables empty selection and sends exact part/scene/image/set bindings",
  wizard.includes("selectedImageScenes.length > 0") &&
    wizard.includes("selectedImageRegenerationReady") &&
    wizard.includes("imageSetSha256: scene.imageSetSha256") &&
    wizard.includes("wizard-action-regenerate-selected-scene-images"),
);
check(
  "UI exposes three-confirmation current-set acceptance",
  wizard.includes("confirmImagesReviewedAll") &&
    wizard.includes("confirmImageVisualQuality") &&
    wizard.includes("confirmImageDownstreamUse") &&
    wizard.includes('confirmImageApprovalText.trim() === "이미지 승인"'),
);
check(
  "image change invalidates old final video summary",
  videoRunner.includes("imageSetSha256: manualVisualReview.imageSetSha256") &&
    helper.includes("videoSummary.imageSetSha256 === manualVisualReview.imageSetSha256"),
);
check(
  "changed Flow reference hash makes the prior render asset stale",
  helper.includes("referenceSha256 !== job.referenceSha256") &&
    helper.indexOf("referenceSha256 !== job.referenceSha256") > helper.indexOf("function flowMotionRenderAssetIsReady"),
);
check(
  "changed Flow contract uses a content-addressed output directory without deleting the prior result",
  flowJobs.includes("contractRevision") &&
    flowJobs.includes("contract-${contractRevision}") &&
    flowJobs.includes("previousContractMatches") &&
    flowRunner.includes("contentAddressedJobDirectory") &&
    flowRunner.includes("qa_job_directory_mismatch") &&
    !flowJobs.includes("rmSync"),
);
const imageHashResetStart = wizard.indexOf("// 이미지 파일 하나라도 바뀌어 image-set hash가 달라지면");
const imageHashResetEnd = wizard.indexOf("// 실제 산출물 상태가 바뀔 때마다", imageHashResetStart);
const imageHashReset = imageHashResetStart >= 0 && imageHashResetEnd > imageHashResetStart
  ? wizard.slice(imageHashResetStart, imageHashResetEnd)
  : "";
check(
  "image-set change clears image approval, Flow inputs, final render, preflight, and unpublished upload confirmations",
  [
    'setImageReviewState("idle")',
    "setImageReviewResult(null)",
    "setFlowMotionApprovalInputs({})",
    'setFinalVideoState("idle")',
    "setFinalVideoResult(null)",
    'setPreflightState("idle")',
    "setPreflightResult(null)",
    "setConfirmReviewed(false)",
    "setConfirmDiscoveryReady(false)",
    "setConfirmPublish(false)",
    'setConfirmText("")',
  ].every((marker) => imageHashReset.includes(marker)) &&
    !imageHashReset.includes("setFlowMotion(null)"),
);
check(
  "automation moves to Owner visual QA only after the technical image set is reviewable",
  automationReadModel.includes("realImagesReviewable: media.realImages.reviewable") &&
    orchestrator.includes("input.realImagesReviewable === true") &&
    !orchestrator.includes("images: imagesGenerated"),
);
check(
  "aggregate media and upload quality gate fail closed on a split approval transaction",
  helper.includes('imageApprovalTransaction.reason === "MANUAL_VISUAL_REVIEW_TRANSACTION_MISMATCH"') &&
    helper.includes("ok: blockerCode === null && reasons.length === 0"),
);
const safeActionsStart = orchestrator.indexOf("MONEY_SHORTS_SAFE_AUTO_ADVANCE_ACTIONS");
const safeActionsEnd = orchestrator.indexOf("const SAFE_AUTO_ADVANCE_ACTIONS", safeActionsStart);
const safeActions = safeActionsStart >= 0 && safeActionsEnd > safeActionsStart
  ? orchestrator.slice(safeActionsStart, safeActionsEnd)
  : "";
check(
  "image approval and selected external regeneration remain Owner-only, never safe-auto",
  orchestrator.includes('action: "realSceneImagesReviewAccept"') &&
    !safeActions.includes("realSceneImagesReviewAccept") &&
    !safeActions.includes("realSceneImagesRegenerateSelected"),
);

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
