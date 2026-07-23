import {
  HOME_PROBLEM_LAB_ENGINE_ID,
  HOME_PROBLEM_LAB_UPLOAD_PROFILE,
  REQUIRED_HOME_PROBLEM_LAB_SCENE_ROLES,
  type HomeProblemLabContentDraft,
  type HomeProblemLabQualityEvidence,
  type HomeProblemLabQualityResult,
} from "./types";

const HARD_FAIL_PATTERNS = [
  /가짜 후기|내돈내산|제가 써봤는데요/u,
  /무조건|100%\s*해결|완전 제거|인생템/u,
  /세제.{0,12}(섞|혼합)|락스.{0,12}(섞|혼합)/u,
];

export function validateHomeProblemLabDraft(draft: HomeProblemLabContentDraft): string[] {
  const failures: string[] = [];
  if (draft.engineId !== HOME_PROBLEM_LAB_ENGINE_ID) failures.push("engine_id_invalid");
  if (draft.uploadProfile !== HOME_PROBLEM_LAB_UPLOAD_PROFILE) failures.push("upload_profile_invalid_or_existing_account_risk");
  for (const role of REQUIRED_HOME_PROBLEM_LAB_SCENE_ROLES) {
    if (!draft.scenes.some((scene) => scene.role === role)) failures.push(`required_scene_missing:${role}`);
  }
  for (const scene of draft.scenes) {
    if (scene.role === "product_card_optional") {
      if (!scene.productCard?.isMock || scene.productCard.isPublishable || scene.visualKind !== "product_card_mock") {
        failures.push("product_card_mock_contract_invalid");
      }
      if (scene.startSecond < 25) failures.push("product_card_before_25_seconds");
    }
    if (scene.role !== "product_card_optional" && scene.visualKind === "product_card_mock") {
      failures.push("product_visual_outside_product_card");
    }
    if (scene.containsAiGeneratedProduct) failures.push("ai_fake_product_detected");
  }
  if (draft.simulatedExternalCalls !== 0 || !draft.dryRun) failures.push("phase2_dry_run_contract_broken");
  if (draft.requiresAdvertisingDisclosure && !draft.advertisingDisclosurePresent) failures.push("advertising_disclosure_missing");
  if (!draft.metadata.title || !draft.metadata.description || draft.metadata.hashtags.length === 0 || !draft.metadata.cta) {
    failures.push("metadata_missing");
  }
  const disclosure = draft.metadata.disclosure;
  if (disclosure.affiliate || disclosure.sponsored || disclosure.groupPurchase || disclosure.label !== "테스트용·게시불가") {
    failures.push("mock_disclosure_contract_invalid");
  }
  return failures;
}

function criterionScore(evidence: Record<string, boolean>): number {
  return Object.values(evidence).filter(Boolean).length;
}

function evaluateEvidence(evidence: HomeProblemLabQualityEvidence) {
  return {
    topicFit: criterionScore(evidence.topicFit),
    firstTwoSecondsHook: criterionScore(evidence.firstTwoSecondsHook),
    problemSolving: criterionScore(evidence.problemSolving),
    naturalPurchaseConversion: criterionScore(evidence.naturalPurchaseConversion),
    aiQualityConsistency: criterionScore(evidence.aiQualityConsistency),
  };
}

export function evaluateHomeProblemLabQuality(draft: HomeProblemLabContentDraft): HomeProblemLabQualityResult {
  const hardFails = validateHomeProblemLabDraft(draft);
  const allText = draft.scenes.map((scene) => scene.narration).join(" ");
  for (const pattern of HARD_FAIL_PATTERNS) {
    if (pattern.test(allText)) hardFails.push(`prohibited_claim:${pattern.source}`);
  }
  const score = evaluateEvidence(draft.qualityEvidence);
  const total = Object.values(score).reduce((sum, value) => sum + value, 0);
  const isQualityCandidate = total >= 22 && hardFails.length === 0;
  return {
    score,
    total,
    hardFails,
    qualityCandidate: isQualityCandidate,
    uploadCandidate: false,
    isQualityCandidate,
    // Phase 2 is dry-run only. A quality-passing sample must still never become publishable.
    isUploadCandidate: false,
  };
}
