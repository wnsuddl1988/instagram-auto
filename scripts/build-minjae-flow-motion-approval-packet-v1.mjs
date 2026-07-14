#!/usr/bin/env node

/**
 * Builds the Flow-specific Minjae articulated-motion preflight packet.
 *
 * Default mode prints the packet. --write-packet writes only under C:\tmp.
 * Neither mode opens a browser, uploads media, types a live prompt, or spends
 * Google Flow credits.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GEMINI_FLOW_TARGET } from "./_gemini-flow-no-submit-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CAST_PATH = path.join(ROOT, "lib", "finance-character-cast-data.json");
const SELECTION_PATH = "C:/tmp/money-shorts-os/web-wizard-create-v1/character-cast-v1/selection.json";
const OUTPUT_DIR = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-flow-motion-pilot-v1";
const OUTPUT_PATH = path.join(OUTPUT_DIR, "approval-packet.json");
const ATTEMPT_ID = "minjae_horizon_flow_motion_v1";

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

const promptSha256 = sha256(prompt);
const requiredOwnerApprovalWording = [
  `APPROVE_FLOW_UPLOAD_PROMPT_NO_SUBMIT: ${ATTEMPT_ID}`,
  `— Gemini 2 Flow 기존 프로젝트 ${GEMINI_FLOW_TARGET.projectId}에서`,
  `reference hash ${referenceSha256} 및 prompt hash ${promptSha256}를`,
  "1회 업로드·입력하되 저장·생성 전송·크레딧 사용 금지",
].join(" ");

const packet = {
  schemaVersion: "minjae_flow_motion_approval_packet_v1",
  attemptId: ATTEMPT_ID,
  status: "OWNER_APPROVAL_REQUIRED_UPLOAD_NO_SUBMIT",
  purpose: "Flow에서 참조 이미지와 정확한 프롬프트를 생성 직전까지만 준비하는 단일 장면 관절 모션 사전점검",
  priorApprovalReuseAllowed: false,
  priorGeminiRetryId: "minjae_horizon_retry_v2",
  character: {
    id: minjae.id,
    name: minjae.name,
    visualStyle: cast.visualStyle,
    referenceFile: reference.file,
    referenceSha256,
    selectedCandidateNumber: reference.candidateNumber,
  },
  scene: {
    id: "minjae_luminous_reading_corner_articulated_motion_flow_v1",
    format: "9:16 vertical, one provider-native short continuous clip",
    prompt,
    promptSha256,
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
  providerUi: {
    provider: "Google Flow",
    profileDesktopShortcutName: "Gemini 2",
    profileId: GEMINI_FLOW_TARGET.profileId,
    cdpPort: GEMINI_FLOW_TARGET.cdpPort,
    projectId: GEMINI_FLOW_TARGET.projectId,
    projectUrl: GEMINI_FLOW_TARGET.projectUrl,
    videoModel: GEMINI_FLOW_TARGET.model,
    aspectRatio: GEMINI_FLOW_TARGET.aspectRatio,
    outputCount: GEMINI_FLOW_TARGET.outputCount,
    confirmBeforeGeneration: GEMINI_FLOW_TARGET.creditSpendApprovalPolicy,
    expectedCreditsPerGeneration: GEMINI_FLOW_TARGET.expectedCreditsPerGeneration,
    referenceMode: "reference_image_to_video",
    accountFallbackAllowed: false,
    reasoningModelSelectionRequired: false,
  },
  outputPlan: {
    root: OUTPUT_DIR,
    packetPath: OUTPUT_PATH,
    uploadIntentPath: path.join(OUTPUT_DIR, "upload-intent.json"),
    preflightSummaryPath: path.join(OUTPUT_DIR, "upload-prompt-no-submit-summary.json"),
    expectedVideoPath: path.join(OUTPUT_DIR, "minjae-flow-motion-raw.mp4"),
    expectedReviewPath: path.join(OUTPUT_DIR, "minjae-flow-motion-review.mp4"),
  },
  liveBoundary: {
    approvalGrantedNow: false,
    referenceAttachedNow: false,
    promptTypedNow: false,
    submittedNow: false,
    settingsSavedNow: false,
    newProjectCreatedNow: false,
    accountChangedNow: false,
    creditsSpentNow: false,
    requiredOwnerApprovalWording,
    generationRequiresSeparateOwnerApproval: true,
  },
};

if (process.argv.includes("--write-packet")) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({
  ...packet,
  packetPath: OUTPUT_PATH,
  written: process.argv.includes("--write-packet"),
}, null, 2));
