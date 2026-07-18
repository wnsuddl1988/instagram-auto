import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  buildProductionPlan,
  loadProductionRecords,
} from "./run-money-shorts-500-production-batch.mjs";
import {
  buildMoneyShortsTtsOwnerListeningEvidence,
  validateMoneyShortsTtsOwnerListeningEvidence,
} from "../lib/money-shorts-tts-owner-listening-gate.mjs";
import { buildMoneyShortsResumablePlan } from "../lib/money-shorts-resumable-orchestrator.mjs";

const VEO_CONTRACT = "money_shorts_veo_scene_selection_v1";
const VIDEO_STRATEGY_CONTRACT = "money_shorts_semantic_prehook_series_v1";

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

const summaries = loadProductionRecords();
const pilotTopicIds = buildProductionPlan(summaries).batchPolicy.pilotTopicIds;
const detailed = loadProductionRecords({ pipelineSmokeTopicIds: pilotTopicIds })
  .filter((record) => pilotTopicIds.includes(record.topicId));

check(
  "smoke uses exactly three deterministic representative finance topics",
  detailed.length === 3 &&
    new Set(detailed.map((record) => record.topicId)).size === 3 &&
    new Set(detailed.map((record) => record.financeSubtopic)).size === 3 &&
    new Set(detailed.map((record) => record.editorialLane)).size === 3,
);
check(
  "every selected topic stays on the finance-only active contract",
  detailed.every((record) =>
    record.pipelineSmoke?.category === "finance" &&
    record.qualityScore >= 86 &&
    record.pipelineSmoke.videoStrategyContractVersion === VIDEO_STRATEGY_CONTRACT
  ),
);

const allParts = detailed.flatMap((record) =>
  record.pipelineSmoke.productionParts.map((part) => ({ record, part })),
);

check(
  "semantic production creates only a complete single or ordered two-part set",
  detailed.every((record) => {
    const parts = record.pipelineSmoke.productionParts;
    return (
      (parts.length === 1 && parts[0].id === "single" && parts[0].totalParts === 1) ||
      (parts.length === 2 &&
        parts[0].id === "part-1" &&
        parts[1].id === "part-2" &&
        parts.every((part) => part.totalParts === 2))
    );
  }),
);
check(
  "every production part preserves the supported dynamic 4~18 scene contract",
  allParts.every(({ part }) => part.script.scenes.length >= 4 && part.script.scenes.length <= 18),
);
check(
  "captions, TTS directions, image evidence, and render scene slots stay one-to-one",
  allParts.every(({ part }) => {
    const count = part.script.scenes.length;
    return part.script.captionLines.length === count &&
      part.speechDirections.length === count &&
      part.script.scenes.every((scene) =>
        typeof scene.captionText === "string" && scene.captionText.trim().length > 0 &&
        typeof scene.visualCue === "string" && scene.visualCue.trim().length > 0 &&
        scene.visualEvidence != null
      );
  }),
);
check(
  "real TTS direction builders preserve continuous Korean v2 contracts for every scene",
  allParts.every(({ part }) =>
    part.speechProfile.engineVersion === "money_shorts_topic_voice_profile_v2" &&
    part.speechDirections.every((direction) =>
      direction.engineVersion === "money_shorts_speech_direction_v2" &&
      direction.contextPolicy === "continuous_full_script" &&
      direction.topicProfileId === part.speechProfile.id &&
      direction.performanceText.trim().length > 0 &&
      direction.segments.length > 0
    )
  ),
);
check(
  "Veo automatic selection is versioned and remains within the per-part 1~2 scene cap",
  allParts.every(({ part }) => {
    const scenes = part.script.scenes;
    const selected = scenes.filter((scene) => scene.mediaStrategy === "veo_motion");
    const cap = scenes[0]?.mediaStrategyMaxVeoScenes;
    return (cap === 1 || cap === 2) &&
      selected.length >= 1 && selected.length <= cap &&
      scenes.every((scene) =>
        scene.mediaStrategyContractVersion === VEO_CONTRACT &&
        ["still", "veo_motion"].includes(scene.mediaStrategy) &&
        scene.mediaStrategyTotalDurationSec >= 15 &&
        scene.mediaStrategyTotalDurationSec <= 60
      );
  }),
);
check(
  "Flow packet preparation consumes exactly the selected Veo scenes and stops at Owner approval",
  allParts.every(({ part }) => {
    const selectedCount = part.script.scenes.filter((scene) => scene.mediaStrategy === "veo_motion").length;
    const state = part.flowMotionState;
    return state.requiredSceneCount === selectedCount &&
      state.jobs.length === selectedCount &&
      state.overallStatus === "approval_pending" &&
      state.renderReadyCount === 0 &&
      state.jobs.every((job) =>
        job.status === "approval_pending" &&
        job.approval.required === true &&
        job.execution.status === "not_started" &&
        job.execution.submissionCount === 0 &&
        job.liveBoundary.externalActionRequiresSeparateOwnerApproval === true
      );
  }),
);
check(
  "Flow smoke performs zero browser, upload, prompt submit, generation, or credit side effects",
  allParts.every(({ part }) => {
    const boundary = part.flowMotionState.noSubmitBoundary;
    return boundary.externalActionPerformed === false &&
      boundary.browserOpened === false &&
      boundary.uploadCount === 0 &&
      boundary.promptSubmitCount === 0 &&
      boundary.generationSubmitCount === 0 &&
      boundary.creditsSpent === 0;
  }),
);

const ttsFixtures = detailed.map((record) => {
  const parts = record.pipelineSmoke.productionParts.map((part) => ({
    partId: part.id,
    audioSha256: sha256(`${record.topicId}:${part.id}:audio-fixture`),
    ttsInputContractSha256: sha256(JSON.stringify(part.speechDirections)),
    wizardScriptFingerprint: sha256(JSON.stringify(part.script)),
    durationSec: part.script.scenes[0].mediaStrategyTotalDurationSec,
  }));
  const evidence = buildMoneyShortsTtsOwnerListeningEvidence({
    topicId: record.topicId,
    parts,
    acceptedAt: "2026-07-18T00:00:00.000Z",
  });
  return { record, parts, evidence };
});
check(
  "synthetic listening fixtures validate only when every current part hash matches",
  ttsFixtures.every(({ record, parts, evidence }) =>
    parts.every((part) =>
      validateMoneyShortsTtsOwnerListeningEvidence({
        evidence,
        topicId: record.topicId,
        currentPart: part,
      }).accepted === true
    )
  ),
);
check(
  "a changed audio hash invalidates the listening approval contract",
  ttsFixtures.every(({ record, parts, evidence }) =>
    validateMoneyShortsTtsOwnerListeningEvidence({
      evidence,
      topicId: record.topicId,
      currentPart: { ...parts[0], audioSha256: sha256(`${record.topicId}:changed-audio`) },
    }).reason === "approved_audio_changed"
  ),
);

function basePlan(record) {
  return {
    topicId: record.topicId,
    scriptReady: true,
    characterReady: true,
    realTtsGenerated: true,
    realTtsQualityAccepted: true,
    realImagesReviewable: true,
    realImagesReady: true,
    flowState: "render_ready",
    flowReadyForRender: true,
    finalVideoReady: false,
    finalVideoOwnerApproved: false,
    mediaQualityGateOk: false,
    publishPreflightReady: false,
    publishedAllParts: false,
    publishRecoveryRequired: false,
  };
}

check(
  "generated TTS always stops at the Owner listening gate before downstream media",
  detailed.every((record) => {
    const plan = buildMoneyShortsResumablePlan({
      ...basePlan(record),
      realTtsQualityAccepted: false,
      realImagesReviewable: false,
      realImagesReady: false,
      flowState: "not_prepared",
      flowReadyForRender: false,
    });
    return plan.next?.action === "realTtsQualityAccept" &&
      plan.next?.gate === "owner_tts_listening_approval" &&
      plan.safeAutoAdvanceActions.length === 0;
  }),
);
check(
  "reviewable images always stop at Owner visual QA before Flow preparation",
  detailed.every((record) => {
    const plan = buildMoneyShortsResumablePlan({
      ...basePlan(record),
      realImagesReady: false,
      flowState: "not_prepared",
      flowReadyForRender: false,
    });
    return plan.next?.action === "realSceneImagesReviewAccept" &&
      plan.next?.gate === "owner_visual_qa" &&
      plan.safeAutoAdvanceActions.length === 0;
  }),
);
check(
  "prepared Veo jobs always stop at the paid Flow approval gate",
  detailed.every((record) => {
    const plan = buildMoneyShortsResumablePlan({
      ...basePlan(record),
      flowState: "approval_pending",
      flowReadyForRender: false,
    });
    return plan.next?.action === "flowMotionGenerate" &&
      plan.next?.gate === "owner_paid_flow" &&
      plan.safeAutoAdvanceActions.length === 0;
  }),
);
check(
  "only hash-aligned TTS, images, and render-ready Veo evidence reaches local final render",
  detailed.every((record) => {
    const plan = buildMoneyShortsResumablePlan(basePlan(record));
    return plan.next?.action === "finalVideoCreate" &&
      plan.next?.gate === "none" &&
      plan.next?.canAutoAdvance === true &&
      JSON.stringify(plan.safeAutoAdvanceActions) === JSON.stringify(["finalVideoCreate"]) &&
      plan.safety.externalGenerationExecuted === false &&
      plan.safety.renderExecuted === false &&
      plan.safety.uploadExecuted === false &&
      plan.safety.publicationExecuted === false &&
      plan.safety.automaticRetryAllowed === false;
  }),
);

const loaderSource = readFileSync(new URL("./run-money-shorts-500-production-batch.mjs", import.meta.url), "utf8");
const smokeSource = readFileSync(new URL("./check-finance-v1-multi-topic-local-pipeline-smoke-v1.mjs", import.meta.url), "utf8");
const smokeRuntimeBlock = smokeSource.slice(0, smokeSource.indexOf("const loaderSource ="));
const detailedLoaderBlock = loaderSource.slice(
  loaderSource.indexOf("export function loadProductionRecords("),
  loaderSource.indexOf("function fingerprint("),
);
check(
  "detailed smoke loader remains local and does not submit or execute providers",
  detailedLoaderBlock.includes("pipelineSmokeTopicIds") &&
    !/fetch\s*\(|playwright|puppeteer|spawnSync\(|execSync\(|writeFile|mkdir|rename|writeProductionLedger/u.test(detailedLoaderBlock),
);
check(
  "smoke harness has no network, process, browser, account, upload, or file mutation authority",
  !/node:child_process|playwright|puppeteer|\bfetch\s*\(|https?:\/\/|process\.env|writeFile|mkdir|rename|unlink|rmSync|actualUpload/u.test(smokeRuntimeBlock),
);

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
