#!/usr/bin/env node

/**
 * Builds the single-scene Minjae Veo motion approval packet.
 * Default mode prints the packet only. --write-packet writes the same packet
 * under C:\tmp; neither mode launches a browser or calls Gemini/Veo.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GEMINI_VEO_PROFILE_CHAIN,
  GEMINI_VEO_PROFILE_CHAIN_VERSION,
  GEMINI_VEO_PROFILE_POLICY,
} from "./_gemini-veo-profile-chain.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CAST_PATH = path.join(ROOT, "lib", "finance-character-cast-data.json");
const SELECTION_PATH = "C:/tmp/money-shorts-os/web-wizard-create-v1/character-cast-v1/selection.json";
const RETRY_V2 = process.argv.includes("--retry-v2");
const PRIOR_CORRECTION_PATH = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-motion-pilot-v1/motion-qa-correction.json";
const OUTPUT_DIR = RETRY_V2
  ? "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-motion-pilot-retry-v2"
  : "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-motion-pilot-v1";
const OUTPUT_PATH = path.join(OUTPUT_DIR, "approval-packet.json");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const cast = JSON.parse(fs.readFileSync(CAST_PATH, "utf8"));
const selection = JSON.parse(fs.readFileSync(SELECTION_PATH, "utf8"));
const minjae = cast.characters.find((character) => character.id === "minjae_horizon");
const reference = selection.selections?.minjae_horizon;
if (!minjae || !reference || reference.candidateNumber !== 2 || !fs.existsSync(reference.file)) {
  throw new Error("ABORT: selected Minjae candidate 2 reference is unavailable");
}
const referenceSha256 = sha256(fs.readFileSync(reference.file));
if (referenceSha256 !== String(reference.imageSha256).toLowerCase()) {
  throw new Error("ABORT: selected Minjae reference hash mismatch");
}

let retryContext = null;
if (RETRY_V2) {
  if (!fs.existsSync(PRIOR_CORRECTION_PATH)) throw new Error("ABORT: prior rejected-download correction is required for retry v2");
  const correction = JSON.parse(fs.readFileSync(PRIOR_CORRECTION_PATH, "utf8"));
  if (correction.status !== "REJECTED_PAST_ARTIFACT" || correction.submittedOnce !== true || correction.automaticRetryAllowed !== false) {
    throw new Error("ABORT: prior attempt is not a verified one-submit rejected-artifact outcome");
  }
  retryContext = {
    retryId: "minjae_horizon_retry_v2",
    priorAttemptId: correction.attemptId,
    priorSubmissionConsumed: true,
    priorRejectedOutputSha256: correction.rejectedOutputSha256,
    priorDuplicateArtifact: correction.duplicateExistingArtifact,
    priorCorrectionPath: PRIOR_CORRECTION_PATH,
    reason: "prior run downloaded a preexisting copier S5 artifact; retry requires new response-scoped provenance",
    newExplicitOwnerApprovalRequired: true,
  };
}

const prompt = [
  "Create one original, non-photoreal vertical 9:16 family-feature-quality cinematic 3D animation clip without copying any studio, franchise, film or known character.",
  "Use the attached identity board only to preserve the recurring character Minjae: a thoughtful Korean man in his early forties with a gentle side-parted black wave, cobalt-blue knit polo, light stone-gray casual jacket and dark olive trousers.",
  "Place him in a luminous, lived-in Korean reading corner connected to a bright balcony: warm wood, tactile books, one plain notebook, a few unlabeled news cards, nearby greenery, open daylight, warm color bounce and open shadows.",
  "Make the room, character and props one coherent authored shot with matched perspective, grounded feet, contact shadows, physically plausible hand-object grip and foreground, character and balcony depth.",
  "Use one continuous medium-wide eye-level 45mm shot with no cut. The camera may drift slowly, but camera motion alone is not enough.",
  "Show true restrained articulated character motion: Minjae finishes a tiny written note, lowers one plain news card with a natural wrist and elbow path, then turns his head and eyes slightly toward the balcony while his other hand keeps the notebook supported. Add only a faint jacket-edge response and subtle balcony-leaf movement.",
  "Keep the expression curious, awake and quietly forward-looking. Preserve believable Korean adult facial proportions, subtly expressive eyes, natural skin texture, shaped hair and relaxed shoulders; no presenter pose, heroic stance, dramatic market reaction, lunge or reach toward camera.",
  "No readable text, numbers, UI, logos, brands, watermark, recognizable currency, extra people, duplicate character, changed wardrobe, deformed hands, laboratory, vault, factory, machine room, black-metal architecture, dark finance imagery, gloomy grade or photoreal live action.",
].join(" ");

const packet = {
  schemaVersion: "minjae_veo_motion_approval_packet_v1",
  status: "OWNER_APPROVAL_REQUIRED_NO_SUBMIT",
  purpose: RETRY_V2
    ? "isolated retry after verified past-artifact download rejection; this packet is not a generation approval"
    : "single-scene true character-motion quality check before any new pilot; this packet is not a generation approval",
  retryContext,
  character: {
    id: minjae.id,
    name: minjae.name,
    visualStyle: cast.visualStyle,
    referenceFile: reference.file,
    referenceSha256,
    selectedCandidateNumber: reference.candidateNumber,
  },
  scene: {
    id: "minjae_luminous_reading_corner_micro_motion_v1",
    format: "9:16 vertical, provider-native short continuous clip",
    prompt,
    promptSha256: sha256(prompt),
    requiredMotionEvidence: [
      "head_and_eye_turn_toward_balcony",
      "news_card_lowers_through_natural_wrist_and_elbow_motion",
      "supporting_notebook_hand_remains_grounded",
      "subtle_jacket_edge_and_balcony_leaf_secondary_motion",
    ],
    acceptanceCriteria: [
      "at least three distinct body articulations are visible; parallax alone is insufficient",
      "one continuous shot with no cut, new person or identity/wardrobe drift",
      "bright warm natural Korean lived-in setting with open shadows",
      "no readable text, finance-machinery imagery or dark laboratory/vault/factory aesthetics",
    ],
  },
  profilePolicy: {
    contractVersion: GEMINI_VEO_PROFILE_CHAIN_VERSION,
    priority: GEMINI_VEO_PROFILE_CHAIN.map((profile) => profile.desktopShortcutName),
    advanceOnlyOn: GEMINI_VEO_PROFILE_POLICY.advanceOnlyOn,
    maxSubmissionCountAcrossChain: 1,
    plannedFirstProfile: "Gemini 2",
  },
  providerUi: {
    reasoningModelTarget: "3.1 Pro",
    reasoningModelSelectionPolicy: "verify selected before Video/Veo tool; change only when target is not selected",
    flashAllowedForThisRetry: false,
    videoToolTarget: "Gemini Video powered by Veo",
  },
  outputPlan: {
    root: OUTPUT_DIR,
    expectedVideoPath: path.join(OUTPUT_DIR, RETRY_V2 ? "minjae-motion-retry-v2-raw.mp4" : "minjae-motion-raw.mp4"),
    expectedReviewPath: path.join(OUTPUT_DIR, RETRY_V2 ? "minjae-motion-retry-v2-review.mp4" : "minjae-motion-review.mp4"),
  },
  liveBoundary: {
    approvalGrantedNow: false,
    promptTypedNow: false,
    referenceAttachedNow: false,
    submittedNow: false,
    accountChangedNow: false,
    requiredOwnerApprovalWording: RETRY_V2
      ? "APPROVE_LIVE_GEMINI_VEO_RETRY: minjae_horizon_retry_v2 — Gemini 2의 3.1 Pro에서 이 retry-v2 packet의 reference hash와 prompt hash로 Veo 1회 추가 전송을 승인함; 명시적 quota_exhausted일 때만 Gemini 3/4 fallback 허용"
      : "APPROVE_LIVE_GEMINI_VEO: minjae_horizon — Gemini 2에서 이 packet의 reference hash와 prompt hash로 Veo 1회 전송을 승인함; 명시적 quota_exhausted일 때만 Gemini 3/4 fallback 허용",
  },
};

if (process.argv.includes("--write-packet")) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(packet, null, 2) + "\n", "utf8");
}

console.log(JSON.stringify({ ...packet, packetPath: OUTPUT_PATH, written: process.argv.includes("--write-packet") }, null, 2));
