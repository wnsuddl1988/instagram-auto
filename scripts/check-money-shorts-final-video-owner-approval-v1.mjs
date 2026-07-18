#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_TEXT,
  buildMoneyShortsFinalVideoOwnerApprovalEvidence,
  buildMoneyShortsPublishPreflightBinding,
  validateMoneyShortsFinalVideoOwnerApprovalEvidence,
  validateMoneyShortsPublishPreflightBinding,
} from "../lib/money-shorts-final-video-owner-approval.mjs";

const ROOT = process.cwd();
const helperSource = readFileSync(
  join(ROOT, "lib", "owner-web-operator.ts"),
  "utf8",
);
const routeSource = readFileSync(
  join(
    ROOT,
    "app",
    "api",
    "money-shorts",
    "operator",
    "route.ts",
  ),
  "utf8",
);
const wizardSource = readFileSync(
  join(ROOT, "components", "VideoCreationWizard.tsx"),
  "utf8",
);
const previewPageSource = readFileSync(
  join(ROOT, "app", "money-shorts", "preview", "page.tsx"),
  "utf8",
);
const rendererSource = readFileSync(
  join(
    ROOT,
    "scripts",
    "run-owner-real-video-from-wizard-assets-once.mjs",
  ),
  "utf8",
);
const publishRunnerSource = readFileSync(
  join(
    ROOT,
    "scripts",
    "run-final-e2e-dual-platform-publish-once.mjs",
  ),
  "utf8",
);
const readModelSource = readFileSync(
  join(ROOT, "lib", "money-shorts-automation-read-model.ts"),
  "utf8",
);
const orchestratorSource = readFileSync(
  join(ROOT, "lib", "money-shorts-resumable-orchestrator.mjs"),
  "utf8",
);

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

const H = {
  audioA: "1".repeat(64),
  audioB: "2".repeat(64),
  imageA: "3".repeat(64),
  imageB: "4".repeat(64),
  videoA: "5".repeat(64),
  videoB: "6".repeat(64),
  metadataA: "7".repeat(64),
  metadataB: "8".repeat(64),
};
const part1 = {
  partId: "part-1",
  wizardScriptFingerprint: "script-part-1",
  audioSha256: H.audioA,
  imageSetSha256: H.imageA,
  finalMp4Sha256: H.videoA,
  publishMetadataSha256: H.metadataA,
  durationSec: 31.2,
  sizeBytes: 1_250_000,
};
const part2 = {
  partId: "part-2",
  wizardScriptFingerprint: "script-part-2",
  audioSha256: H.audioB,
  imageSetSha256: H.imageB,
  finalMp4Sha256: H.videoB,
  publishMetadataSha256: H.metadataB,
  durationSec: 28.4,
  sizeBytes: 1_180_000,
};
const topicId = "finance-final-video-hash-test";
const evidence = buildMoneyShortsFinalVideoOwnerApprovalEvidence({
  topicId,
  parts: [part2, part1],
  acceptedAt: "2026-07-18T00:00:00.000Z",
});
const reordered = buildMoneyShortsFinalVideoOwnerApprovalEvidence({
  topicId,
  parts: [part1, part2],
  acceptedAt: "2026-07-19T00:00:00.000Z",
});

check(
  "exact Korean approval text is fixed",
  MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_TEXT === "최종 영상 승인",
);
check(
  "two-part fingerprint is deterministic regardless of input order and acceptedAt",
  evidence.finalVideoApprovalFingerprint ===
    reordered.finalVideoApprovalFingerprint,
);
check(
  "part 1 validates against the shared approval transaction",
  validateMoneyShortsFinalVideoOwnerApprovalEvidence({
    evidence,
    topicId,
    currentPart: part1,
  }).accepted === true,
);
check(
  "part 2 validates against the same shared approval transaction",
  validateMoneyShortsFinalVideoOwnerApprovalEvidence({
    evidence,
    topicId,
    currentPart: part2,
  }).accepted === true,
);

for (const [field, value] of [
  ["wizardScriptFingerprint", "changed-script"],
  ["audioSha256", "9".repeat(64)],
  ["imageSetSha256", "a".repeat(64)],
  ["finalMp4Sha256", "b".repeat(64)],
  ["publishMetadataSha256", "c".repeat(64)],
  ["durationSec", 32.1],
  ["sizeBytes", 1_250_001],
]) {
  const changed = { ...part1, [field]: value };
  check(
    `${field} change invalidates the previous Owner approval`,
    validateMoneyShortsFinalVideoOwnerApprovalEvidence({
      evidence,
      topicId,
      currentPart: changed,
    }).accepted === false,
  );
}

check(
  "topic change invalidates the previous Owner approval",
  validateMoneyShortsFinalVideoOwnerApprovalEvidence({
    evidence,
    topicId: `${topicId}-other`,
    currentPart: part1,
  }).accepted === false,
);
check(
  "fingerprint tampering is rejected",
  validateMoneyShortsFinalVideoOwnerApprovalEvidence({
    evidence: {
      ...evidence,
      finalVideoApprovalFingerprint: "d".repeat(64),
    },
    topicId,
    currentPart: part1,
  }).accepted === false,
);
let subsetRejected = false;
try {
  buildMoneyShortsFinalVideoOwnerApprovalEvidence({
    topicId,
    parts: [part1],
  });
} catch {
  subsetRejected = true;
}
check(
  "a two-part approval cannot be built from part-1 alone",
  subsetRejected,
);
check(
  "validator enforces the exact expected production part set",
  validateMoneyShortsFinalVideoOwnerApprovalEvidence({
    evidence,
    topicId,
    currentPart: part1,
    expectedPartIds: ["single"],
  }).accepted === false,
);
let duplicateRejected = false;
try {
  buildMoneyShortsFinalVideoOwnerApprovalEvidence({
    topicId,
    parts: [part1, part1],
  });
} catch {
  duplicateRejected = true;
}
check("duplicate production part evidence is rejected", duplicateRejected);

const currentPreflightBinding = {
  contentUnitManifestPath:
    "C:\\tmp\\money-shorts-os\\publish\\unit.json",
  contentUnitSha256: "d".repeat(64),
  instagramSourceSha256: H.videoA,
  youtubeSourceSha256: H.videoA,
  publishMetadataSha256: H.metadataA,
  finalVideoApprovalFingerprint:
    evidence.finalVideoApprovalFingerprint,
};
const preflightEvidence = buildMoneyShortsPublishPreflightBinding({
  current: currentPreflightBinding,
  boundAt: "2026-07-18T00:01:00.000Z",
});
check(
  "exact full-hash preflight binding validates",
  validateMoneyShortsPublishPreflightBinding({
    evidence: preflightEvidence,
    current: currentPreflightBinding,
  }).valid === true,
);
for (const [field, value] of [
  [
    "contentUnitManifestPath",
    "C:\\tmp\\money-shorts-os\\publish\\other.json",
  ],
  ["contentUnitSha256", "e".repeat(64)],
  ["instagramSourceSha256", H.videoB],
  ["youtubeSourceSha256", H.videoB],
  ["publishMetadataSha256", H.metadataB],
  ["finalVideoApprovalFingerprint", "f".repeat(64)],
]) {
  check(
    `${field} change invalidates the previous preflight`,
    validateMoneyShortsPublishPreflightBinding({
      evidence: preflightEvidence,
      current: { ...currentPreflightBinding, [field]: value },
    }).valid === false,
  );
}
check(
  "preflight binding fingerprint tampering is rejected",
  validateMoneyShortsPublishPreflightBinding({
    evidence: {
      ...preflightEvidence,
      bindingFingerprint: "0".repeat(64),
    },
    current: currentPreflightBinding,
  }).valid === false,
);
check(
  "preflight without an explicit binding fingerprint is rejected",
  validateMoneyShortsPublishPreflightBinding({
    evidence: {
      ...preflightEvidence,
      bindingFingerprint: undefined,
    },
    current: currentPreflightBinding,
  }).valid === false,
);
check(
  "preflight with a stale binding schema is rejected",
  validateMoneyShortsPublishPreflightBinding({
    evidence: {
      ...preflightEvidence,
      schemaVersion: "stale_binding_v0",
    },
    current: currentPreflightBinding,
  }).valid === false,
);

check(
  "renderer writes a full MP4 SHA-256 into the render summary",
  rendererSource.includes("finalMp4Sha256") &&
    /createHash\("sha256"\)[\s\S]{0,100}readFileSync\(finalPath\)/.test(
      rendererSource,
    ),
);
check(
  "server recomputes current MP4 bytes and checks the render summary hash",
  helperSource.includes("currentFinalMp4Sha256") &&
    helperSource.includes("renderSummaryHashMatches") &&
    helperSource.includes(
      "videoSummary?.finalMp4Sha256 === currentFinalMp4Sha256",
    ),
);
check(
  "final preview URL and response bytes are bound to the displayed full MP4 hash",
  wizardSource.includes(
    "sha256=${encodeURIComponent(part.finalVideo.finalMp4Sha256",
  ) &&
    previewPageSource.includes("&sha256=${sha256}") &&
    routeSource.includes('url.searchParams.get("sha256")') &&
    helperSource.includes(
      'createHash("sha256").update(bytes).digest("hex")',
    ) &&
    helperSource.includes(
      "currentFinalMp4Sha256 !== expectedFinalMp4Sha256",
    ),
);
check(
  "renderer binds the final MP4 provenance to the exact input audio hash",
  rendererSource.includes("const audioSha256 = createHash") &&
    rendererSource.includes("audioSha256,") &&
    helperSource.includes(
      "videoSummary.audioSha256 === realTts.audioSha256",
    ),
);
check(
  "Owner approval action requires exact stale UI part hashes",
  helperSource.includes("final_video_owner_stale_ui_claim") &&
    routeSource.includes('"finalVideoReviewAccept"') &&
    routeSource.includes("expectedParts"),
);
const finalReviewRouteBlock =
  routeSource.match(
    /if \(action === "finalVideoReviewAccept"\) \{([\s\S]*?)\n  \}\n\n  \/\/ ── 게시 전 점검/,
  )?.[1] ?? "";
check(
  "Owner final review action records local evidence without runner or external calls",
  finalReviewRouteBlock.includes("acceptWizardFinalVideoReview") &&
    !/runOperatorScript|fetch\(|allowArm|actualUpload/.test(
      finalReviewRouteBlock,
    ),
);
check(
  "all production parts share one atomically replaced Owner approval file",
  helperSource.includes(
    "const path = wizardFinalVideoOwnerApprovalPath(topicId)",
  ) &&
    helperSource.includes("renameSync(tempPath, path)") &&
    !helperSource.includes(
      "wizardFinalVideoOwnerApprovalPath(part)",
    ),
);
check(
  "content unit carries exact Owner evidence and source integrity",
  helperSource.includes("ownerFinalVideoApproval") &&
    helperSource.includes("sourceIntegrity") &&
    helperSource.includes("publishMetadataSha256") &&
    helperSource.includes("finalVideoApprovalFingerprint"),
);
check(
  "preflight reader binds manifest and both platform full source hashes to current artifacts",
  helperSource.includes("boundToCurrentArtifacts") &&
    helperSource.includes(
      "validateMoneyShortsPublishPreflightBinding",
    ) &&
    helperSource.includes(
      "youtubeSourceSha256:" +
        "\n          currentPart?.finalVideo.finalMp4Sha256",
    ),
);
check(
  "actual upload command rejects stale full-hash preflight evidence",
  helperSource.includes(
    "pf.boundToCurrentArtifacts !== true",
  ) &&
    helperSource.includes(
      "pf.contentUnitSha256 !== builtUnit.paths.contentUnitSha256",
    ) &&
    helperSource.includes(
      "pf.finalVideoApprovalFingerprint !==",
    ),
);
check(
  "preflight action itself rejects a result not bound to current artifacts",
  routeSource.includes(
    'pf.boundToCurrentArtifacts !== true',
  ) &&
    routeSource.includes(
      '"PREFLIGHT_ARTIFACT_BINDING_FAILED"',
    ),
);
check(
  "publish runner validates Owner approval before the first external side effect",
  publishRunnerSource.indexOf(
    "OWNER_APPROVED_FINAL_VIDEO_HASH_MISMATCH",
  ) >= 0 &&
    publishRunnerSource.indexOf(
      "OWNER_APPROVED_FINAL_VIDEO_HASH_MISMATCH",
    ) <
      publishRunnerSource.indexOf(
        "sideEffectCounters.blobPutCount += 1",
      ),
);
check(
  "publish runner cross-checks manifest production identity and exact part set",
  publishRunnerSource.includes("productionIdentityReady") &&
    publishRunnerSource.includes("expectedPartIds") &&
    publishRunnerSource.includes(
      "unit.wizardProductionPartId === productionPartId",
    ),
);
check(
  "armed runner rejects stale preflight before external side effects",
  publishRunnerSource.indexOf(
    "PREFLIGHT_EVIDENCE_STALE_OR_MISSING",
  ) >= 0 &&
    publishRunnerSource.indexOf(
      "PREFLIGHT_EVIDENCE_STALE_OR_MISSING",
    ) <
      publishRunnerSource.indexOf(
        "sideEffectCounters.blobPutCount += 1",
      ),
);
check(
  "preflight writes full manifest, IG, YT, metadata and Owner approval hashes",
  [
    "contentUnitSha256",
    "instagramSourceSha256: igSha256",
    "youtubeSourceSha256: ytSha256",
    "publishMetadataSha256",
    "finalVideoApprovalFingerprint",
  ].every((token) => publishRunnerSource.includes(token)),
);
check(
  "YouTube uploads the already-hashed in-memory bytes",
  publishRunnerSource.includes("Readable.from(ytSourceBuffer)") &&
    !publishRunnerSource.includes("createReadStream(ytSourcePath)"),
);
check(
  "wizard exposes exact final video and metadata review UI",
  wizardSource.includes(
    'data-testid="wizard-action-final-video-review-accept"',
  ) &&
    wizardSource.includes('placeholder="최종 영상 승인"') &&
    wizardSource.includes("Instagram 게시 문구") &&
    wizardSource.includes("YouTube 게시 문구"),
);
check(
  "final video identity changes clear approval, preflight and unpublished confirmations",
  wizardSource.includes("[selectedTopicId, finalVideoIdentityKey]") &&
    [
      "setFinalVideoReviewState(\"idle\")",
      "setPreflightState(\"idle\")",
      "setConfirmReviewed(false)",
      "setConfirmDiscoveryReady(false)",
      "setConfirmPublish(false)",
    ].every((token) => wizardSource.includes(token)),
);
check(
  "upload request carries the exact current final approval fingerprint",
  wizardSource.includes(
    "expectedFinalVideoApprovalFingerprint",
  ) &&
    routeSource.includes(
      "FINAL_VIDEO_OWNER_APPROVAL_STALE",
    ),
);
check(
  "automation preflight readiness requires current artifact binding",
  readModelSource.includes(
    "evidence.boundToCurrentArtifacts === true",
  ),
);
check(
  "automation stops at explicit Owner final video review",
  orchestratorSource.includes(
    'action: "finalVideoReviewAccept"',
  ) &&
    orchestratorSource.includes('gate: "owner_final_media_qa"'),
);

console.log(
  `\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`,
);
process.exit(failed === 0 ? 0 : 1);
