#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  MONEY_SHORTS_TTS_OWNER_APPROVAL_TEXT,
  buildMoneyShortsTtsOwnerListeningEvidence,
  validateMoneyShortsTtsOwnerListeningEvidence,
} from "../lib/money-shorts-tts-owner-listening-gate.mjs";
import { buildMoneyShortsResumablePlan } from "../lib/money-shorts-resumable-orchestrator.mjs";

const helperSource = readFileSync("lib/owner-web-operator.ts", "utf8");
const routeSource = readFileSync(
  "app/api/money-shorts/operator/route.ts",
  "utf8",
);
const wizardSource = readFileSync(
  "components/VideoCreationWizard.tsx",
  "utf8",
);
const readModelSource = readFileSync(
  "lib/money-shorts-automation-read-model.ts",
  "utf8",
);
const orchestratorSource = readFileSync(
  "lib/money-shorts-resumable-orchestrator.mjs",
  "utf8",
);

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
}

const part1 = {
  partId: "part-1",
  audioSha256: "a".repeat(64),
  ttsInputContractSha256: "b".repeat(64),
  wizardScriptFingerprint: "script-part-1",
  durationSec: 41.25,
};
const part2 = {
  partId: "part-2",
  audioSha256: "c".repeat(64),
  ttsInputContractSha256: "d".repeat(64),
  wizardScriptFingerprint: "script-part-2",
  durationSec: 39.75,
};
const evidence = buildMoneyShortsTtsOwnerListeningEvidence({
  topicId: "gen-finance-owner-listening-test",
  parts: [part1, part2],
  acceptedAt: "2026-07-18T00:00:00.000Z",
});

check(
  "exact Owner approval literal is fixed",
  MONEY_SHORTS_TTS_OWNER_APPROVAL_TEXT === "음성 승인",
);
check(
  "current part 1 evidence validates",
  validateMoneyShortsTtsOwnerListeningEvidence({
    evidence,
    topicId: "gen-finance-owner-listening-test",
    currentPart: part1,
  }).accepted === true,
);
check(
  "current part 2 evidence validates",
  validateMoneyShortsTtsOwnerListeningEvidence({
    evidence,
    topicId: "gen-finance-owner-listening-test",
    currentPart: part2,
  }).accepted === true,
);
check(
  "changed audio invalidates approval",
  validateMoneyShortsTtsOwnerListeningEvidence({
    evidence,
    topicId: "gen-finance-owner-listening-test",
    currentPart: { ...part1, audioSha256: "e".repeat(64) },
  }).reason === "approved_audio_changed",
);
check(
  "changed TTS input invalidates approval",
  validateMoneyShortsTtsOwnerListeningEvidence({
    evidence,
    topicId: "gen-finance-owner-listening-test",
    currentPart: {
      ...part1,
      ttsInputContractSha256: "f".repeat(64),
    },
  }).reason === "approved_audio_changed",
);
check(
  "changed script fingerprint invalidates approval",
  validateMoneyShortsTtsOwnerListeningEvidence({
    evidence,
    topicId: "gen-finance-owner-listening-test",
    currentPart: {
      ...part1,
      wizardScriptFingerprint: "changed-script",
    },
  }).reason === "approved_audio_changed",
);
check(
  "tampered evidence fingerprint fails closed",
  validateMoneyShortsTtsOwnerListeningEvidence({
    evidence: { ...evidence, qualityApprovalFingerprint: "0".repeat(64) },
    topicId: "gen-finance-owner-listening-test",
    currentPart: part1,
  }).reason === "approval_fingerprint_mismatch",
);

const acceptRouteBlock =
  routeSource.match(
    /if \(action === "realTtsQualityAccept"\) \{([\s\S]*?)\n  \}\n\n  \/\/ Owner가 정확히 승인한 ElevenLabs/,
  )?.[1] ?? "";
check(
  "quality accept route requires all confirmations and exact text",
  helperSource.includes('"realTtsQualityAccept"') &&
    [
    "confirmListenedAllParts",
    "confirmVoiceQualityAccepted",
    "confirmDownstreamUse",
    "approvalText",
    ].every((token) => acceptRouteBlock.includes(token)) &&
    acceptRouteBlock.includes("acceptWizardRealTtsListeningQuality"),
);
check(
  "quality accept route cannot invoke external runner",
  acceptRouteBlock.length > 0 &&
    !/runOperatorScript|fetch\(|includeMediaEnv|ALLOW_/u.test(acceptRouteBlock),
);
check(
  "quality acceptance is local-runtime only",
  /const LOCAL_SCRIPT_ACTIONS[\s\S]*"realTtsQualityAccept"/u.test(
    routeSource,
  ),
);
check(
  "approval evidence is written per production part",
  /pipeline\.paths\.parts\.map\(\(part\)[\s\S]*wizardTtsOwnerListeningApprovalPath\(part\)/u.test(
    helperSource,
  ),
);
check(
  "multi-part readiness requires every part and one shared approval fingerprint",
  helperSource.includes("allPartsTtsQualityAccepted") &&
    helperSource.includes("candidateTtsQualityFingerprint") &&
    /parts\.every\([\s\S]*qualityApprovalFingerprint[\s\S]*candidateTtsQualityFingerprint/u.test(
      helperSource,
    ),
);
check(
  "image command fails closed before external generation",
  /case "realSceneImagesCreate":[\s\S]*?realTts\.qualityAccepted[\s\S]*?real_tts_owner_approval_required[\s\S]*?SCRIPT_REAL_SCENE_IMAGES/u.test(
    helperSource,
  ),
);
check(
  "Flow authorization checks listening approval before state mutation",
  /if \(action === "flowMotionGenerate"\)[\s\S]*?realTts\.qualityAccepted[\s\S]*?authorizeWizardFlowMotionGeneration/u.test(
    routeSource,
  ),
);
check(
  "final render command requires listening approval",
  /case "finalVideoCreate":[\s\S]*?realTts\.qualityAccepted[\s\S]*?real_tts_owner_approval_required[\s\S]*?SCRIPT_REAL_VIDEO/u.test(
    helperSource,
  ),
);
check(
  "automation readiness uses quality acceptance instead of generation",
  readModelSource.includes(
    "realTtsQualityAccepted: media.realTts.qualityAccepted",
  ) &&
    orchestratorSource.includes("owner_tts_listening_approval"),
);
const generatedButUnapprovedPlan = buildMoneyShortsResumablePlan({
  topicId: "gen-finance-owner-listening-test",
  scriptReady: true,
  characterReady: true,
  realTtsGenerated: true,
  realTtsQualityAccepted: false,
  generatedImageCount: 0,
  expectedImageCount: 8,
  realImagesReady: false,
  flowState: "not_prepared",
  flowReadyForRender: false,
  finalVideoReady: false,
  mediaQualityGateOk: false,
  publishPreflightReady: false,
  publishedAllParts: false,
});
check(
  "generated-but-unapproved TTS stops at Owner listening gate",
  generatedButUnapprovedPlan.next?.action === "realTtsQualityAccept" &&
    generatedButUnapprovedPlan.next?.gate ===
      "owner_tts_listening_approval" &&
    generatedButUnapprovedPlan.next?.canAutoAdvance === false,
);
check(
  "wizard exposes audio players before approval",
  wizardSource.includes("realTtsGenerated && selectedTopicId") &&
    wizardSource.includes('data-testid="wizard-tts-owner-listening-gate"'),
);
check(
  "wizard requires three confirmations and exact literal",
  [
    "confirmTtsListenedAllParts",
    "confirmTtsVoiceQuality",
    "confirmTtsDownstreamUse",
    'confirmTtsApprovalText.trim() === "음성 승인"',
  ].every((token) => wizardSource.includes(token)),
);
check(
  "wizard image action is disabled before listening approval",
  /data-testid="wizard-action-real-images"[\s\S]{0,400}disabled=\{[^}]*!realTtsReady/u.test(
    wizardSource,
  ),
);

if (failures > 0) {
  console.error(`\nRESULT: ${failures} FAILED`);
  process.exit(1);
}
console.log("\nRESULT: ALL PASS");
