"use client";

/**
 * VideoCreationWizard — 자동 쇼츠 만들기 위저드 (Owner용 메인 흐름).
 *
 * task: owner-one-click-video-creation-ui-v1
 * task: owner-web-auto-topic-refresh-and-upload-button-v1
 *
 * 카테고리 → 새 주제 추천 → 대본 → 음성 → 영상 → 미리보기 → 게시 전 점검 → 실제 업로드
 * 순서를 버튼으로 진행한다. 모든 실행은 /api/money-shorts/operator 의 고정 action enum을
 * 통해서만 이뤄진다. 실제 업로드는 마지막 단계에서만, 시안 영상 + 게시 전 점검 통과 +
 * Owner 명시 확인(체크 3개 + "업로드" 입력)을 모두 만족해야 실행된다.
 */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// ── 타입 ─────────────────────────────────────────────────────────────────────

type RunState = "idle" | "running" | "success" | "blocked" | "error";

type OperatorResult = {
  action: string;
  status: "success" | "blocked" | "error";
  summary: string;
  detail?: string;
  blockerCode?: string;
  raw?: unknown;
};

type WizardTopic = {
  topicId: string;
  title: string;
  hook: string;
  reason: string;
  scriptReady: boolean;
  recommended: boolean;
  category?: string;
  angle?: string;
  qualityScore?: number;
  rewrittenReasons?: string[];
  source?: "editorial_bank" | "claude_generated" | "local_bank" | "fixture";
  noveltyNote?: string;
  financeSubtopic?: string;
  problemStatement?: string;
  twist?: string;
  takeawayAction?: string;
  editorialDecision?: "make" | "maybe" | "reject" | null;
  requiresEditorialDecision?: boolean;
};

type WizardEditorialPreferenceSummary = {
  total: number;
  make: number;
  maybe: number;
  reject: number;
  remainingCalibration: number;
};

type WizardScriptScene = {
  id: string;
  label: string;
  narration: string;
  captionText: string;
  visualCue: string;
  mediaStrategy?: "still" | "veo_motion";
  mediaStrategySource?: "automatic" | "manual_override" | "budget_cap";
  mediaStrategyScore?: number;
  mediaStrategyMaxVeoScenes?: number;
};

type WizardQuality = {
  retentionScore: number;
  selfRecognitionScore: number;
  clarityScore: number;
  visualizabilityScore: number;
  antiAiToneScore: number;
  specificityScore: number;
  overallScore: number;
  rejectReasons: string[];
  rewriteReasons: string[];
  passed: boolean;
};

type WizardScript = {
  title: string;
  hook: string;
  hookLine?: string;
  curiosity: string;
  points: string[];
  twist: string;
  action: string;
  captionLines?: string[];
  fullVoiceover: string;
  scenes?: WizardScriptScene[];
  videoStrategy?: {
    contractVersion: string;
    mode: "single" | "two_part";
    openingVoice: { v3AudioTag: string; speedCap: number; stance: string };
    parts: Array<{
      id: "single" | "part-1" | "part-2";
      partNumber: number;
      totalParts: number;
      coverLines: Array<{ spokenText: string; displayText: string; emphasis: string }>;
      coverHookAudit?: {
        contractVersion: string;
        passed: boolean;
        failures: string[];
      };
      bridgeNarration: string | null;
      recapNarration: string | null;
    }>;
  } | null;
  captionFirstLineHook?: string;
  uploadCaptionDraft?: string;
  hookScore: number | null;
  clarityScore: number | null;
  quality?: WizardQuality;
  selectedStyle?: string;
  qualitySummary?: {
    goodReasons: string[];
    fixedParts: string[];
    watchOuts: string[];
  };
  candidateScores?: Array<{ style: string; overallScore: number; selected: boolean }>;
};

type WizardVideo = {
  exists: boolean;
  flowStatus: string | null;
  steps: Array<{ id: string; status: string }>;
  muxedMp4Path: string | null;
  muxedMp4Bytes: number | null;
  topicId: string | null;
  topicTitle: string | null;
};

type WizardUploadReadyItem = {
  topicId: string;
  title: string;
  category: "finance";
  totalParts: number;
  totalDurationSec: number | null;
  updatedAt: string | null;
  status: "ready" | "needs_attention";
  detail: string;
  recoveryStates: WizardPublishRecoveryState[];
};

type WizardPublishRecoveryStateName =
  | "not_started"
  | "complete"
  | "no_external_failed"
  | "instagram_only"
  | "both_published_ledger_missing"
  | "ambiguous"
  | "invalid_evidence";

type WizardPublishRecoveryState = {
  partId: string;
  state: WizardPublishRecoveryStateName;
  reason: string;
  recoveryFingerprint: string | null;
  instagramMediaId: string | null;
  youtubeVideoId: string | null;
  manualRecoveryRequired: boolean;
  genericDualUploadBlocked: boolean;
  automaticRetryAllowed: boolean;
  recoverablePlatformCandidate: string | null;
  attemptEvidence: {
    present: boolean;
    journalValid: boolean;
    reason: string;
    claimSha256: string | null;
    eventCount: number;
    latestTransition: string | null;
    latestRecordedAtIso: string | null;
    latestEventSha256: string | null;
  };
  ownerResolution: {
    present: boolean;
    valid: boolean;
    applied: boolean;
    sha256: string | null;
    resolutionFingerprint: string | null;
    sourceRecoveryFingerprint: string | null;
    instagramPermalink: string | null;
    youtubeChannelId: string | null;
    checkedAtIso: string | null;
  };
  youtubeOnlyRecovery: {
    schemaVersion: string;
    present: boolean;
    valid: boolean;
    status: string | null;
    reason: string;
    claimSha256: string | null;
    resultSha256: string | null;
    resultFingerprint: string | null;
    eventCount: number;
    latestTransition: string | null;
    latestEventSha256: string | null;
    youtubeVideoId: string | null;
    youtubeUrl: string | null;
    writeLockReleased: boolean | null;
    automaticRetryAllowed: false;
    externalActionAllowed: false;
  };
  reconciliationPacket: {
    mode: "read_only_evidence_packet";
    conclusion: string;
    confirmedFacts: Array<{
      id: string;
      label: string;
      value: string | null;
    }>;
    uncertainFacts: Array<{
      id: string;
      label: string;
      value: string | null;
    }>;
    ownerReview: Array<{
      id: string;
      label: string;
    }>;
    safety: {
      automaticRetryAllowed: false;
      automaticRecoveryAllowed: false;
      externalActionCount: 0;
      uploadAllowed: false;
      ledgerMutationAllowed: false;
    };
  };
};

type WizardFinanceCharacterCast = {
  version: string;
  visualStyle: string;
  candidateCount: number;
  selectedCount: number;
  allSelected: boolean;
  characters: Array<{
    id: string;
    name: string;
    label: string;
    role: string;
    subtopics: string[];
    selectedCandidateNumber: number | null;
    candidatesReady: boolean;
    blockerCode: string | null;
    candidates: Array<{
      candidateNumber: number;
      ready: boolean;
      width: number | null;
      height: number | null;
      direction: string;
    }>;
  }>;
};

/** 대본 생성 방식(로컬 후보 선별 → Claude 1회 보정) 결과 메타데이터. */
type WizardScriptEngine = {
  mode: "claude_polished" | "local_only";
  claudeApplied: boolean;
  note: string;
  reasonCode: string;
  model: string | null;
  rewriteNotes: string[];
  localScore: number | null;
  polishedScore: number | null;
};

/** 실제 음성/장면 이미지/최종 영상 준비 상태 + media quality gate (서버 realMediaStatus 응답). */
type WizardRealMedia = {
  production: {
    strategyVersion: string | null;
    mode: "single" | "two_part";
    totalParts: number;
  };
  scriptEngine: {
    finalReady: boolean;
    mode: "claude_polished" | "local_only" | null;
    note: string | null;
    rewriteNotes: string[];
    polishDisabled: boolean;
    anthropicKeyPresent: boolean;
    elevenLabsKeyPresent: boolean;
  };
  realTts: {
    ready: boolean;
    qualityAccepted: boolean;
    qualityApprovalFingerprint: string | null;
    qualityAcceptedAt: string | null;
    audioSha256: string | null;
    audioPath: string | null;
    durationSec: number | null;
    provider: string | null;
    apiCallCount: number | null;
    missingEnv: string[];
  };
  realImages: {
    ready: boolean;
    reviewable: boolean;
    generatedCount: number;
    expectedCount: number | null;
    dir: string | null;
    blocked: string | null;
    blockerDetail?: string | null;
    manualVisualReview: {
      accepted: boolean;
      imageSetSha256: string | null;
      approvalTransactionId: string | null;
      reason: string | null;
    };
    scenes: Array<{
      sceneIndex: number;
      ready: boolean;
      imageSha256: string | null;
      width: number | null;
      height: number | null;
    }>;
  };
  finalVideo: {
    ready: boolean;
    mp4Path: string | null;
    finalMp4Sha256: string | null;
    publishMetadataSha256: string | null;
    publishMetadata: {
      sha256: string;
      instagram: {
        captionFirstLineHook: string;
        caption: string;
        hashtags: string[];
        callToAction: string;
      };
      youtube: {
        title: string;
        description: string;
        tags: string[];
      };
    } | null;
    ownerApproved: boolean;
    ownerApprovalFingerprint: string | null;
    ownerApprovedAt: string | null;
    durationSec: number | null;
    width: number | null;
    height: number | null;
    hasAudio: boolean;
    sizeBytes: number | null;
  };
  mediaQualityGate: {
    ok: boolean;
    reasons: string[];
    blockerCode: string | null;
  };
  parts: Array<{
    id: "single" | "part-1" | "part-2";
    partNumber: number;
    totalParts: number;
    canonicalTitle: string;
    platformTitle: string;
    realTts: WizardRealMedia["realTts"];
    realImages: WizardRealMedia["realImages"];
    finalVideo: WizardRealMedia["finalVideo"];
    mediaQualityGate: WizardRealMedia["mediaQualityGate"];
  }>;
};

type WizardFlowMotionState = "not_prepared" | "not_required" | "approval_pending" | "generating" | "qa_pending" | "qa_pass" | "qa_failed" | "render_ready";

type WizardFlowMotionStatus = {
  state: WizardFlowMotionState;
  requiredCount: number;
  preparedCount: number;
  approvalPendingCount: number;
  generatingCount: number;
  qaPendingCount: number;
  qaPassCount: number;
  qaFailedCount: number;
  renderReadyCount: number;
  readyForRender: boolean;
  parts: Array<{
    id: "single" | "part-1" | "part-2";
    partNumber: number;
    totalParts: number;
    state: WizardFlowMotionState;
    jobs: Array<{
      jobId: string;
      sceneNumber: number;
      sceneLabel: string;
      status: "approval_pending" | "generating" | "qa_pending" | "qa_pass" | "qa_failed" | "render_ready";
      packetPath: string;
      expectedVideoPath: string;
      referenceSha256: string;
      promptSha256: string;
      requiredApprovalWording: string;
      outputVideoSha256: string | null;
      execution: {
        status: "not_started" | "authorized" | "downloaded" | "failed";
        selectedProfile: "Gemini 2" | "Gemini 3" | "Gemini 4" | null;
        submissionCount: 0 | 1;
        expectedCreditsSpent: number;
        summaryPath: string | null;
      };
      creditUsageStatus: "confirmed_zero" | "confirmed_spent" | "unknown";
      renderAssetReady: boolean;
    }>;
  }>;
};

type WizardAutomationPlan = {
  schemaVersion: string;
  topicId: string;
  status: "ready_to_advance" | "owner_action_required" | "publication_confirmation_required" | "manual_recovery_required" | "complete";
  completedStageCount: number;
  totalStageCount: number;
  stages: Array<{
    id: string;
    label: string;
    state: "ready" | "current" | "waiting";
  }>;
  next: {
    stageId: string;
    stageLabel: string;
    action: string | null;
    gate: string;
    reason: string;
    canAutoAdvance: boolean;
  } | null;
  safeAutoAdvanceActions: string[];
  safety: {
    externalGenerationExecuted: false;
    paidActionExecuted: false;
    renderExecuted: false;
    uploadExecuted: false;
    publicationExecuted: false;
    automaticRetryAllowed: false;
  };
};

type WizardAutomationExecutionGuard = {
  status: "available" | "not_applicable" | "topic_in_flight" | "manual_review_required" | "identical_attempt_recorded" | "store_unavailable";
  receipt: {
    executionId: string | null;
    planFingerprint: string | null;
    action: string | null;
    status: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    resultStatus: string | null;
    blockerCode: string | null;
  } | null;
  recovery?: {
    status: "none" | "decision_required" | "manual_evidence_required";
    comparison: "no_in_flight_lock" | "current_plan_unchanged" | "artifacts_advanced" | "ambiguous_plan_change" | "invalid_lock_evidence" | "receipt_lock_mismatch";
    allowedDecision: "acknowledge_artifacts_advanced" | "clear_for_manual_retry" | null;
    currentPlanFingerprint?: string;
    beforeCompletedStageCount?: number | null;
    currentCompletedStageCount?: number | null;
    receipt: WizardAutomationExecutionGuard["receipt"];
  } | null;
};

type WizardSafeSession = {
  schemaVersion: string;
  updatedAt: string | null;
  currentSession: {
    sessionId: string;
    mode: "owner_started_bounded_local";
    status: "ready" | "stop_requested";
    maxActionCount: 1 | 2 | 3;
    completedActionCount: number;
    actionInFlight: boolean;
    activeClaim: {
      jobId: string;
      topicId: string;
      action: string;
      planFingerprint: string;
      claimFingerprint: string;
      startedAt: string;
    } | null;
    lastTerminalResult: {
      claimFingerprint: string;
      recoveryFingerprint?: string;
      resultStatus: "success" | "blocked" | "error";
      blockerCode: string | null;
      actionCount: 1;
      finishedAt: string;
    } | null;
    lastRecoveryResult: {
      recoveryFingerprint: string;
      claimFingerprint: string;
      decision: string;
      terminalResult: {
        resultStatus: "success" | "blocked" | "error";
        blockerCode: string | null;
        actionCount: 1;
      } | null;
      actionCountDelta: 0 | 1;
      sessionDisposition: string;
      resolvedAt: string;
    } | null;
    startedAt: string;
    updatedAt: string;
    stopRequestedAt: string | null;
  } | null;
  history: Array<{
    at: string;
    kind: string;
    sessionId: string;
    maxActionCount: 1 | 2 | 3;
    actionCount: number;
  }>;
};

type WizardSafeSessionRecovery = {
  schemaVersion: string;
  mode: "evidence_only_recovery_plan";
  state: "inactive" | "decision_required" | "manual_evidence_required";
  comparison: string;
  allowedDecision:
    | "clear_unstarted_session_claim"
    | "clear_session_claim_after_execution_recovery"
    | "terminalize_session_from_receipt"
    | "resolve_execution_then_clear_session_claim"
    | "resolve_execution_then_terminalize_session"
    | null;
  reason: string;
  sessionId: string | null;
  claimFingerprint: string | null;
  currentPlanFingerprint: string | null;
  recoveryFingerprint: string;
  executionRecoveryDecision: "acknowledge_artifacts_advanced" | "clear_for_manual_retry" | null;
  terminalResult: {
    resultStatus: "success" | "blocked" | "error";
    blockerCode: string | null;
    actionCount: 1;
  } | null;
  actionCountDelta: 0 | 1;
  sessionDisposition: "unchanged" | "keep_locked" | "halt_after_clear" | "terminalize_matching_claim";
  ownerConfirmationRequired: boolean;
  actionExecuted: false;
  executionReceiptCreated: false;
  executionReceiptMutated: false;
  sessionStateWritten: false;
  automaticRetryCount: 0;
  paidActionExecuted: false;
  externalGenerationExecuted: false;
  renderExecuted: false;
  uploadExecuted: false;
  publicationExecuted: false;
};

type WizardSafeSessionCoordinator = {
  schemaVersion: string;
  mode: "session_coordinator_dry_run";
  state: "inactive" | "ready" | "waiting" | "halted" | "blocked";
  reason: string;
  sessionId: string | null;
  sessionStoreUpdatedAt: string | null;
  sessionDecisionFingerprint: string | null;
  queuePreviewFingerprint: string | null;
  coordinatorFingerprint: string;
  nextClaim: {
    previewFingerprint: string;
    jobId: string;
    topicId: string;
    action: string;
    planFingerprint: string;
  } | null;
  actionPlannedCount: 0 | 1;
  actionExecuted: false;
  executionReceiptCreated: false;
  queueStateWritten: false;
  sessionStateWritten: false;
  lockAcquired: false;
  automaticRetryCount: 0;
  safety: {
    timerEnabled: false;
    backgroundWorkerEnabled: false;
    paidActionEnabled: false;
    externalGenerationEnabled: false;
    ownerQaDecisionEnabled: false;
    uploadEnabled: false;
    publicationEnabled: false;
  };
};

type WizardSafeSessionCloseView = {
  schemaVersion: string;
  mode: "owner_confirmed_archive_close_view";
  eligible: boolean;
  reasonCode: string;
  reason: string;
  sessionId: string | null;
  closeReason: "stop_requested" | "action_cap_reached" | "stop_requested_and_action_cap_reached" | null;
  closeFingerprint: string | null;
  actionExecuted: false;
  executionReceiptCreated: false;
  sessionStateWritten: false;
  automaticRetryCount: 0;
  paidActionExecuted: false;
  externalGenerationExecuted: false;
  renderExecuted: false;
  uploadExecuted: false;
  publicationExecuted: false;
};

type WizardAutomationQueueJob = {
  jobId: string;
  topicId: string;
  title: string;
  queueOrder: number;
  createdAt: string;
  updatedAt: string;
  persistedPlan: {
    fingerprint: string;
    completedStageCount: number | null;
    totalStageCount: number | null;
    currentStageLabel: string | null;
    nextGate: string | null;
  };
  livePlan: WizardAutomationPlan;
  executionGuard: WizardAutomationExecutionGuard;
  lifecycle: {
    status: "active" | "paused";
    changedAt: string;
  } | null;
  lastAdvance: {
    at: string;
    status: string | null;
    blockerCode: string | null;
    executedAction: string | null;
    actionCount: 0 | 1;
    automaticRetryCount: 0;
  } | null;
};

type WizardAutomationQueueArchivedJob = {
  jobId: string;
  topicId: string;
  title: string;
  archivedAt: string;
  archiveReason: "completed_plan";
  lastAdvance: WizardAutomationQueueJob["lastAdvance"];
  archivedPlan: {
    completedStageCount: number | null;
    totalStageCount: number | null;
  };
  executionGuard: {
    status: string | null;
    receipt: {
      action: string | null;
      status: string | null;
      resultStatus: string | null;
    } | null;
  };
};

type WizardAutomationQueueHistoryEntry = {
  at: string;
  kind: "safe_action_finished" | "paused" | "resumed" | "removed" | "archived_completed" | "priority_moved_earlier" | "priority_moved_later";
  jobId: string;
  topicId: string;
  title: string;
  action?: string | null;
  status?: string | null;
  blockerCode?: string | null;
  queueOrder?: number;
  actionCount?: 0 | 1;
  lastAdvance?: WizardAutomationQueueJob["lastAdvance"];
};

type WizardAutomationQueueEvaluation = {
  jobId: string | null;
  topicId: string | null;
  title: string | null;
  queueOrder: number | null;
  createdAt: string | null;
  eligible: boolean;
  selected: boolean;
  eligibilityCode: string;
  eligibilityReason: string;
  decisionReason: string;
  action: string | null;
  stageId: string | null;
  stageLabel: string | null;
  gate: string | null;
  completedStageCount: number | null;
  totalStageCount: number | null;
  executionGuardStatus: string | null;
  planFingerprint: string | null;
  executionGuardFingerprint: string;
};

type WizardAutomationQueueRunPreview = {
  schemaVersion: string;
  mode: "deterministic_dry_run";
  evaluatedJobCount: number;
  eligibleJobCount: number;
  selectionCount: 0 | 1;
  previewFingerprint: string | null;
  selected: {
    jobId: string;
    topicId: string;
    title: string;
    queueOrder: number;
    createdAt: string;
    action: string;
    stageId: string;
    stageLabel: string;
    gate: string;
    completedStageCount: number;
    totalStageCount: number;
    planFingerprint: string;
    executionGuardFingerprint: string;
    reason: string;
  } | null;
  evaluations: WizardAutomationQueueEvaluation[];
  safety: {
    actionExecuted: false;
    executionReceiptCreated: false;
    timerEnabled: false;
    backgroundWorkerEnabled: false;
    automaticRetryEnabled: false;
    paidActionEnabled: false;
    externalGenerationEnabled: false;
    uploadEnabled: false;
    publicationEnabled: false;
  };
};

type WizardAutomationQueueBatchPolicy = {
  schemaVersion: string;
  mode: "no_submit_batch_policy_preview";
  itemCount: number;
  localSafeItemCount: number;
  ownerStopItemCount: number;
  entries: Array<{
    jobId: string | null;
    topicId: string | null;
    title: string | null;
    queueOrder: number | null;
    action: string | null;
    gate: string | null;
    stageLabel: string | null;
    kind: "local_safe_next" | "local_safe_waiting" | "paid_generation_approval" | "owner_qa" | "publication_approval" | "topic_selection" | "owner_approval" | "manual_recovery" | "paused" | "complete" | "execution_blocked";
    label: string;
    detail: string;
  }>;
  safety: {
    actionExecuted: false;
    executionReceiptCreated: false;
    timerEnabled: false;
    backgroundWorkerEnabled: false;
    automaticRetryEnabled: false;
    paidActionEnabled: false;
    externalGenerationEnabled: false;
    uploadEnabled: false;
    publicationEnabled: false;
  };
};

type WizardAutomationQueueCapacitySummary = {
  schemaVersion: string;
  mode: "no_submit_capacity_summary";
  queueItemCount: number;
  localSafeReadyCount: number;
  localSafeWaitingCount: number;
  paidGenerationApprovalCount: number;
  ownerQualityCheckCount: number;
  publicationApprovalCount: number;
  ownerDecisionCount: number;
  pausedCount: number;
  recoveryOrBlockedCount: number;
  completedCount: number;
  safety: WizardAutomationQueueBatchPolicy["safety"];
};

type WizardUnattendedPolicyPreview = {
  schemaVersion: string;
  mode: "owner_started_unattended_policy_status";
  currentMode: "owner_started_bounded_local";
  activationState: "bounded_local_no_submit_available";
  enabledProfileId: "bounded_local_no_submit";
  recommendedProfileId: "bounded_local_no_submit";
  policyFingerprint: string;
  reason: string;
  options: Array<{
    profileId: "bounded_local_no_submit" | "bounded_external_generation" | "autonomous_publish";
    label: string;
    riskLevel: "low" | "high" | "critical";
    recommended: boolean;
    availability: "available_owner_started" | "inactive_requires_exact_owner_approval";
    description: string;
    localNoSubmitActionAllowed: boolean;
    paidTtsAllowed: boolean;
    imageGenerationAllowed: boolean;
    flowGenerationAllowed: boolean;
    ownerQaDecisionAllowed: boolean;
    uploadAllowed: boolean;
    publicationAllowed: boolean;
    maxActionsPerSession: number | null;
    maxConcurrentActions: number;
    automaticRetryLimit: number;
  }>;
  currentQueueEvidence: {
    queueItemCount: number;
    localSafeReadyCount: number;
    localSafeWaitingCount: number;
    paidGenerationApprovalCount: number;
    ownerQualityCheckCount: number;
    publicationApprovalCount: number;
    ownerDecisionCount: number;
    recoveryOrBlockedCount: number;
  };
  requiredOwnerDecisionsBeforeActivation: string[];
  safety: {
    viewOnly: true;
    boundedLocalRunEnabled: true;
    policyStateWritten: false;
    activationChanged: false;
    actionExecuted: false;
    executionReceiptCreated: false;
    timerEnabled: false;
    backgroundWorkerEnabled: false;
    automaticRetryEnabled: false;
    paidActionEnabled: false;
    externalGenerationEnabled: false;
    ownerQaDecisionEnabled: false;
    uploadEnabled: false;
    publicationEnabled: false;
  };
};

type WizardExternalGenerationBudgetPolicyPreview = {
  schemaVersion: string;
  mode: "read_only_external_generation_budget_policy";
  currentProfileId: "owner_approval_each_submission";
  recommendedProfileId: "bounded_per_topic_external_generation";
  activationState: "blocked_missing_owner_limits";
  activationReady: false;
  policyFingerprint: string;
  sourcePolicyFingerprint: string;
  reason: string;
  options: Array<{
    profileId:
      | "owner_approval_each_submission"
      | "bounded_per_topic_external_generation"
      | "multi_topic_unattended_generation";
    label: string;
    riskLevel: "current" | "high" | "critical";
    recommended: boolean;
    availability:
      | "active_current_mode"
      | "blocked_missing_owner_limits"
      | "inactive_requires_separate_architecture";
    description: string;
  }>;
  providerBudgets: Array<{
    providerId: "elevenlabs_tts" | "chatgpt_scene_images" | "google_flow_veo_fast";
    label: string;
    action: "realTtsCreate" | "realSceneImagesCreate" | "flowMotionGenerate";
    budgetUnit: "provider_request" | "image_submission" | "credit";
    proposedPerTopicSubmissionCap: number;
    proposedPerDaySubmissionCap: number | null;
    proposedPerMonthSubmissionCap: number | null;
    proposedPerTopicCreditCap: number | null;
    estimatedCreditPerSubmission: number | null;
    maxConcurrentSubmissions: 1;
    automaticRetryLimit: 0;
    primaryAccountAlias?: "Gemini 2";
    accountFallbackPolicy: "disabled" | "disabled_until_exact_owner_approval";
    humanQaRequired: true;
    humanQaGate: string;
  }>;
  stopRules: Array<{
    event: string;
    disposition: string;
    retryAllowed: false;
    accountFallbackAllowed: false;
    evidenceRequired: string;
  }>;
  missingOwnerDecisions: string[];
  invariants: {
    exactInputFingerprintRequired: true;
    preSubmitBudgetReservationRequired: true;
    terminalReceiptRequiredBeforeNextSubmission: true;
    unknownSubmissionResultLocksBudget: true;
    providerHistoryEvidenceRequiredBeforeClear: true;
    humanQaRequired: true;
    maxConcurrentSubmissions: 1;
    automaticRetryLimit: 0;
  };
  safety: {
    viewOnly: true;
    budgetStateWritten: false;
    budgetReserved: false;
    activationChanged: false;
    actionExecuted: false;
    executionReceiptCreated: false;
    timerEnabled: false;
    backgroundWorkerEnabled: false;
    automaticRetryEnabled: false;
    paidActionEnabled: false;
    externalGenerationEnabled: false;
    accountFallbackEnabled: false;
    ownerQaDecisionEnabled: false;
    uploadEnabled: false;
    publicationEnabled: false;
  };
};

type WizardAutomationQueue = {
  schemaVersion: string;
  mode: "owner_click_planning_only";
  updatedAt: string | null;
  jobs: WizardAutomationQueueJob[];
  archivedJobs: WizardAutomationQueueArchivedJob[];
  history: WizardAutomationQueueHistoryEntry[];
  runPreview: WizardAutomationQueueRunPreview;
  batchPolicy: WizardAutomationQueueBatchPolicy;
  capacitySummary: WizardAutomationQueueCapacitySummary;
  unattendedPolicy: WizardUnattendedPolicyPreview;
  externalGenerationBudgetPolicy: WizardExternalGenerationBudgetPolicyPreview;
  safety: {
    timerEnabled: false;
    backgroundWorkerEnabled: false;
    automaticAdvanceEnabled: false;
    automaticRetryEnabled: false;
    paidActionEnabled: false;
    externalGenerationEnabled: false;
    publicationEnabled: false;
  };
};

const AUTOMATION_GATE_LABEL: Record<string, string> = {
  none: "자동으로 이어갈 수 있는 로컬 단계",
  owner_topic_selection: "주제·대본 확인 필요",
  owner_character_selection: "주인공 이미지 확인 필요",
  owner_paid_tts: "유료 음성 승인에서 중단",
  owner_tts_listening_approval: "실제 음성 청취 승인에서 중단",
  owner_image_generation: "외부 이미지 생성 승인에서 중단",
  owner_visual_qa: "전체 이미지 검수에서 중단",
  owner_paid_flow: "Flow 1회 생성 승인에서 중단",
  owner_flow_qa: "Veo 영상 검수에서 중단",
  owner_flow_rework_decision: "Veo 재작업 결정에서 중단",
  owner_final_media_qa: "최종 영상 검수에서 중단",
  owner_publication_confirmation: "실제 게시 확인에서 중단",
  manual_recovery: "재전송 없이 수동 복구 필요",
};

const PUBLISH_RECOVERY_STATE_LABEL: Record<WizardPublishRecoveryStateName, string> = {
  not_started: "게시 시작 전",
  complete: "양쪽 게시 완료",
  no_external_failed: "외부 게시 전 실패",
  instagram_only: "Instagram만 게시됨",
  both_published_ledger_missing: "양쪽 게시 확인 · 원장 누락",
  ambiguous: "게시 결과 불명확",
  invalid_evidence: "게시 증거 무효",
};

const PUBLISH_ATTEMPT_TRANSITION_LABEL: Record<string, string> = {
  external_execution_ready: "외부 실행 직전 기록",
  blob_put_intent: "영상 저장 요청 전",
  blob_put_confirmed: "영상 저장 확인",
  blob_head_intent: "영상 확인 요청 전",
  blob_head_confirmed: "영상 확인 완료",
  instagram_container_intent: "Instagram 컨테이너 요청 전",
  instagram_container_confirmed: "Instagram 컨테이너 확인",
  instagram_poll_intent: "Instagram 처리 상태 확인 전",
  instagram_poll_observed: "Instagram 처리 상태 확인",
  instagram_poll_unknown: "Instagram 처리 상태 응답 불명확",
  instagram_container_ready: "Instagram 게시 준비 확인",
  instagram_publish_intent: "Instagram 게시 요청 전",
  instagram_publish_confirmed: "Instagram 게시 확인",
  youtube_channel_verify_intent: "YouTube 채널 확인 요청 전",
  youtube_channel_verify_confirmed: "YouTube 채널 확인 완료",
  youtube_insert_intent: "YouTube 업로드 요청 전",
  youtube_insert_confirmed: "YouTube 업로드 확인",
  ledger_write_intent: "게시 원장 기록 전",
  ledger_write_confirmed: "게시 원장 기록 확인",
  complete: "게시 시도 기록 완료",
};

const AUTOMATION_EXECUTION_GUARD_LABEL: Record<WizardAutomationExecutionGuard["status"], string> = {
  available: "중복 실행 잠금 준비됨",
  not_applicable: "현재 자동 실행 대상 없음",
  topic_in_flight: "이 주제의 안전 작업이 실행 중",
  manual_review_required: "중단된 이전 실행 수동 확인 필요",
  identical_attempt_recorded: "같은 계획의 실행 기록 확인 필요",
  store_unavailable: "실행 영수증 저장소 확인 필요",
};

const AUTOMATION_RECOVERY_CONFIRM_TEXT = {
  acknowledge_artifacts_advanced: "산출물 전진 확인 완료",
  clear_for_manual_retry: "실행 없음 확인 재시도 허용",
} as const;

const SAFE_SESSION_RECOVERY_CONFIRM_TEXT = {
  clear_unstarted_session_claim: "미실행 세션 claim 해제 확인",
  clear_session_claim_after_execution_recovery: "실행 복구 완료 후 세션 claim 해제 확인",
  terminalize_session_from_receipt: "일치 영수증으로 세션 작업 종결 확인",
} as const;

const SAFE_SESSION_RUN_CONFIRM_TEXT = "다음 안전 작업 1회 실행";
const SAFE_SESSION_BOUNDED_RUN_CONFIRM_TEXT = "로컬 안전 작업 최대 3회 연속 실행";
const SAFE_SESSION_CLOSE_CONFIRM_TEXT = "안전 세션 보관 종료 확인";

type WizardSafeSessionDirectRecoveryDecision =
  keyof typeof SAFE_SESSION_RECOVERY_CONFIRM_TEXT;

function isSafeSessionDirectRecoveryDecision(
  decision: WizardSafeSessionRecovery["allowedDecision"],
): decision is WizardSafeSessionDirectRecoveryDecision {
  return decision != null &&
    Object.prototype.hasOwnProperty.call(SAFE_SESSION_RECOVERY_CONFIRM_TEXT, decision);
}

const FLOW_MOTION_STATUS_LABEL: Record<WizardFlowMotionState, string> = {
  not_prepared: "패킷 준비 필요",
  not_required: "모션 장면 없음",
  approval_pending: "생성 승인 대기",
  generating: "생성 중",
  qa_pending: "Owner 영상 검수 대기",
  qa_pass: "검수 통과",
  qa_failed: "검수 실패",
  render_ready: "렌더 준비",
};

const FLOW_MOTION_QA_ITEMS = [
  ["trueArticulatedMotion", "인물의 관절·손 또는 이야기 사물이 실제로 움직인다"],
  ["cameraOnlyMotionRejected", "줌·패닝·시차만 움직인 영상이 아니다"],
  ["identityContinuity", "한국 성인 인물의 얼굴·헤어·의상이 기준 이미지와 같다"],
  ["sceneContinuity", "공간·소품·구도와 장면 의미가 유지된다"],
  ["brightWarmNonPhotoreal3D", "밝고 따뜻한 비실사 3D 톤을 유지한다"],
  ["forbiddenDarkFinanceImageryAbsent", "어두운 금고·공장·기계실·검은 금융 이미지가 없다"],
  ["technicalArtifactsAbsent", "손·얼굴·물체 변형, 복제, 깜빡임 등 기술 결함이 없다"],
] as const;

type FlowMotionQaKey = (typeof FLOW_MOTION_QA_ITEMS)[number][0];
type FlowMotionQaState = Partial<Record<FlowMotionQaKey, boolean>>;

// ── V1 active category (재테크 쇼츠만 노출) ──────────────────────────────────

/** 카테고리를 고르면 보여줄 한 줄 소개 — 재테크팁은 돈·성공·심리·생활습관 톤을 명시한다. */
const CATEGORY_DESC: Record<string, string> = {
  finance: "돈·성공·심리·생활습관 — 아끼라는 잔소리 대신, 돈 앞에서 마음이 움직이는 방식을 다룹니다.",
  ai: "AI를 일상과 일에 바로 써먹는 활용법을 다룹니다.",
  meme: "밈과 짤을 센스 있게 쓰는 감각을 다룹니다.",
  news: "뉴스와 소문에 속지 않는 읽기 습관을 다룹니다.",
  tmi: "알고 나면 말하고 싶어지는 생활 지식을 다룹니다.",
  game: "게임을 더 재미있게 만드는 습관과 매너를 다룹니다.",
  animal: "반려동물과 더 잘 지내는 방법을 다룹니다.",
  celeb: "덕질을 오래 즐겁게 하는 방법을 다룹니다.",
};

const CATEGORIES = [
  { id: "finance", label: "재테크팁" },
] as const;

const FINANCE_SUBTOPICS: Array<{ id: string; label: string; desc: string }> = [
  { id: "all", label: "전체", desc: "전체 돈·경제 주제에서 추천" },
  { id: "economy_literacy", label: "경제뉴스·돈공부", desc: "뉴스, 경제 흐름, 정보 격차" },
  { id: "inflation_living_cost", label: "물가·생활비", desc: "장바구니, 식비, 생활비 기준" },
  { id: "interest_debt", label: "금리·빚", desc: "이자, 대출, 카드값, 상환" },
  { id: "consumption_psychology", label: "소비심리", desc: "결제, 세일, 충동, 합리화" },
  { id: "sns_comparison", label: "SNS비교", desc: "피드, 체면, 관계 지출" },
  { id: "labor_income", label: "월급·소득", desc: "월급날, 연봉, 현금흐름" },
  { id: "investing_assets", label: "투자·자산", desc: "주식, 수익률, 자산 기준" },
  { id: "housing_asset_gap", label: "집값·주거비", desc: "월세, 전세, 집, 고정비" },
  { id: "anxiety_avoidance", label: "불안·회피", desc: "잔고, 고지서, 숫자 직면" },
  { id: "success_habits", label: "성공습관", desc: "기준, 루틴, 감정 통제" },
  { id: "crisis_risk", label: "위기·비상금", desc: "불황, 리스크, 생존비" },
  { id: "time_retirement", label: "시간·노후", desc: "미래, 복리, 장기 선택" },
];

const FINANCE_SUBTOPIC_LABELS = Object.fromEntries(FINANCE_SUBTOPICS.map((s) => [s.id, s.label])) as Record<string, string>;

// ── API 호출 ─────────────────────────────────────────────────────────────────

async function postAction(action: string, extra?: Record<string, unknown>): Promise<OperatorResult> {
  // 주제 추천은 로컬 데이터만 읽는 짧은 작업이다. 서버 문제가 생겨도
  // 화면이 영원히 "진행 중"에 머물지 않도록 이 action에만 제한시간을 둔다.
  const controller = action === "topicRecommend" ? new AbortController() : null;
  const timeoutId = controller ? window.setTimeout(() => controller.abort(), 25_000) : null;
  try {
    const res = await fetch("/api/money-shorts/operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
      signal: controller?.signal,
    });
    return (await res.json()) as OperatorResult;
  } finally {
    if (timeoutId != null) window.clearTimeout(timeoutId);
  }
}

// ── 작은 UI 조각 ─────────────────────────────────────────────────────────────

function StateBadge({ state }: { state: RunState }) {
  if (state === "idle") return null;
  const styles: Record<Exclude<RunState, "idle">, string> = {
    running: "bg-slate-100 text-slate-600 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-300",
    blocked: "bg-amber-50 text-amber-700 border-amber-300",
    error: "bg-red-50 text-red-700 border-red-300",
  };
  const labels: Record<Exclude<RunState, "idle">, string> = {
    running: "진행 중…",
    success: "완료",
    blocked: "확인 필요",
    error: "오류",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold shrink-0 ${styles[state]}`}>
      {labels[state]}
    </span>
  );
}

function ResultNote({ result }: { result: OperatorResult | null }) {
  if (!result) return null;
  const color =
    result.status === "success" ? "text-emerald-700" : result.status === "blocked" ? "text-amber-700" : "text-red-600";
  return (
    <div className="mt-2.5 space-y-1">
      <p className={`text-[15px] font-semibold ${color}`}>{result.summary}</p>
      {result.detail ? <p className="text-sm text-slate-500 leading-relaxed">{result.detail}</p> : null}
      {result.raw != null ? (
        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer hover:text-slate-600">개발자용 자세한 내용 보기</summary>
          <pre className="mt-1 p-2 rounded bg-slate-50 border border-slate-200 overflow-x-auto max-h-48 overflow-y-auto text-slate-500">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

const PUBLISH_OWNER_RECONCILIATION_DECISION =
  "confirm_instagram_published_youtube_not_published";
const PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT =
  "유튜브 미게시 확인";

function isOwnerReconciliationPart(
  partId: WizardPublishRecoveryState["partId"],
): partId is "part-1" | "part-2" {
  return partId === "part-1" || partId === "part-2";
}

function PublishOwnerReconciliationForm({
  topicId,
  recovery,
  disabled,
  onResolved,
}: {
  topicId: string;
  recovery: WizardPublishRecoveryState;
  disabled: boolean;
  onResolved: () => Promise<void>;
}) {
  const [instagramPermalink, setInstagramPermalink] =
    useState("");
  const [youtubeChannelId, setYoutubeChannelId] =
    useState("");
  const [
    confirmInstagramPublished,
    setConfirmInstagramPublished,
  ] = useState(false);
  const [
    confirmYoutubeNotPublished,
    setConfirmYoutubeNotPublished,
  ] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [result, setResult] =
    useState<OperatorResult | null>(null);
  const [running, setRunning] = useState(false);
  const ready =
    !disabled &&
    !running &&
    isOwnerReconciliationPart(recovery.partId) &&
    recovery.state === "ambiguous" &&
    recovery.reason === "youtube_publish_outcome_unknown" &&
    recovery.instagramMediaId != null &&
    recovery.youtubeVideoId == null &&
    recovery.attemptEvidence.present &&
    recovery.attemptEvidence.journalValid &&
    recovery.recoveryFingerprint != null &&
    confirmInstagramPublished &&
    confirmYoutubeNotPublished &&
    instagramPermalink.trim().length > 0 &&
    youtubeChannelId.trim().length > 0 &&
    confirmation.trim() ===
      PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT;

  const resolve = async () => {
    if (!ready || !recovery.recoveryFingerprint) return;
    setRunning(true);
    setResult(null);
    try {
      const response = await postAction(
        "publishOwnerReconciliationResolve",
        {
          topicId,
          productionPartId: recovery.partId,
          expectedRecoveryFingerprint:
            recovery.recoveryFingerprint,
          decision: PUBLISH_OWNER_RECONCILIATION_DECISION,
          confirmation: confirmation.trim(),
          confirmInstagramPublished,
          confirmYoutubeNotPublished,
          instagramPermalink: instagramPermalink.trim(),
          youtubeChannelId: youtubeChannelId.trim(),
        },
      );
      setResult(response);
      if (response.status === "success") {
        await onResolved();
      }
    } catch {
      setResult({
        action: "publishOwnerReconciliationResolve",
        status: "error",
        summary:
          "Owner 부분 게시 대조 기록 요청에 실패했습니다.",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      data-testid="wizard-publish-owner-reconciliation-form"
      className="mt-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-3"
    >
      <p className="text-xs font-bold text-violet-900">
        수동 확인 결과 고정
      </p>
      <p className="mt-1 text-xs leading-relaxed text-violet-800">
        Instagram 게시물과 YouTube Studio의 미게시 상태를 직접
        확인한 경우에만 기록합니다. 기록해도 업로드나 복구는
        실행되지 않습니다.
      </p>
      <label className="mt-2 block text-xs font-semibold text-slate-700">
        Instagram 공개 주소
        <input
          data-testid="wizard-publish-owner-instagram-permalink"
          type="url"
          value={instagramPermalink}
          onChange={(event) =>
            setInstagramPermalink(event.target.value)
          }
          placeholder="https://www.instagram.com/.../reel/.../"
          disabled={disabled || running}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-normal"
        />
      </label>
      <label className="mt-2 block text-xs font-semibold text-slate-700">
        확인한 YouTube 채널 ID
        <input
          data-testid="wizard-publish-owner-youtube-channel-id"
          type="text"
          value={youtubeChannelId}
          onChange={(event) =>
            setYoutubeChannelId(event.target.value)
          }
          placeholder="UC로 시작하는 채널 ID"
          disabled={disabled || running}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-normal"
        />
      </label>
      <label className="mt-2 flex items-start gap-2 text-xs text-slate-700">
        <input
          data-testid="wizard-publish-owner-confirm-instagram"
          type="checkbox"
          checked={confirmInstagramPublished}
          onChange={(event) =>
            setConfirmInstagramPublished(event.target.checked)
          }
          disabled={disabled || running}
          className="mt-0.5"
        />
        위 Instagram 주소에서 해당 편 게시물을 직접 확인했습니다.
      </label>
      <label className="mt-2 flex items-start gap-2 text-xs text-slate-700">
        <input
          data-testid="wizard-publish-owner-confirm-youtube"
          type="checkbox"
          checked={confirmYoutubeNotPublished}
          onChange={(event) =>
            setConfirmYoutubeNotPublished(event.target.checked)
          }
          disabled={disabled || running}
          className="mt-0.5"
        />
        위 YouTube 채널의 Studio에서 해당 영상이 없음을 직접
        확인했습니다.
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          data-testid="wizard-publish-owner-confirmation"
          type="text"
          value={confirmation}
          onChange={(event) =>
            setConfirmation(event.target.value)
          }
          placeholder="유튜브 미게시 확인"
          disabled={disabled || running}
          className="w-48 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
        />
        <button
          data-testid="wizard-action-publish-owner-reconciliation"
          type="button"
          onClick={resolve}
          disabled={!ready}
          className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? "기록 중…" : "수동 대조 결과 고정"}
        </button>
      </div>
      <ResultNote result={result} />
    </div>
  );
}

function PublishRecoveryEvidence({
  topicId,
  states,
  disabled,
  onResolved,
}: {
  topicId: string;
  states: WizardPublishRecoveryState[];
  disabled: boolean;
  onResolved: () => Promise<void>;
}) {
  return (
    <div
      data-testid="wizard-publish-recovery-evidence"
      className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
    >
      <p className="text-xs font-bold text-amber-800">자동 재시도 0회 · 일반 양쪽 업로드 차단</p>
      {states.length === 0 ? (
        <p className="mt-1 text-xs text-amber-700">편별 게시 증거를 받지 못했습니다. 서버 상태를 다시 확인해야 합니다.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {states.map((recovery) => (
            <div
              key={`${recovery.partId}:${recovery.recoveryFingerprint ?? recovery.state}`}
              data-testid="wizard-publish-recovery-part"
              className="border-t border-amber-200 pt-2 first:border-t-0 first:pt-0"
            >
              <p className="text-xs font-bold text-slate-800">
                {recovery.partId} · {PUBLISH_RECOVERY_STATE_LABEL[recovery.state]}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{recovery.reason}</p>
              <dl className="mt-1 grid gap-x-3 gap-y-0.5 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="inline font-bold">Instagram ID: </dt>
                  <dd className="inline break-all">{recovery.instagramMediaId ?? "없음"}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">YouTube ID: </dt>
                  <dd className="inline break-all">{recovery.youtubeVideoId ?? "없음"}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">복구 후보: </dt>
                  <dd className="inline">{recovery.recoverablePlatformCandidate ?? "없음"}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">복구 지문: </dt>
                  <dd className="inline break-all">{recovery.recoveryFingerprint ?? "없음"}</dd>
                </div>
                <div data-testid="wizard-publish-attempt-evidence-status">
                  <dt className="inline font-bold">시도 기록: </dt>
                  <dd className="inline">
                    {recovery.attemptEvidence.present
                      ? recovery.attemptEvidence.journalValid
                        ? "있음 · 무결성 확인"
                        : "있음 · 무결성 수동 확인 필요"
                      : "없음"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-bold">기록 수: </dt>
                  <dd className="inline">{recovery.attemptEvidence.eventCount}건</dd>
                </div>
                <div>
                  <dt className="inline font-bold">마지막 기록: </dt>
                  <dd className="inline">
                    {recovery.attemptEvidence.latestTransition
                      ? PUBLISH_ATTEMPT_TRANSITION_LABEL[
                          recovery.attemptEvidence.latestTransition
                        ] ?? recovery.attemptEvidence.latestTransition
                      : "없음"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-bold">기록 시각: </dt>
                  <dd className="inline break-all">
                    {recovery.attemptEvidence.latestRecordedAtIso ?? "없음"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-bold">기록 판정: </dt>
                  <dd className="inline break-all">
                    {recovery.attemptEvidence.reason}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-bold">claim hash: </dt>
                  <dd className="inline break-all">
                    {recovery.attemptEvidence.claimSha256 ?? "없음"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-bold">journal head: </dt>
                  <dd className="inline break-all">
                    {recovery.attemptEvidence.latestEventSha256 ?? "없음"}
                  </dd>
                </div>
              </dl>
              {recovery.ownerResolution.applied ? (
                <div
                  data-testid="wizard-publish-owner-reconciliation-applied"
                  className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800"
                >
                  <p className="font-bold">
                    Owner 수동 대조 증거 적용됨
                  </p>
                  <p className="mt-1 break-all">
                    Instagram:{" "}
                    {recovery.ownerResolution.instagramPermalink ??
                      "주소 없음"}
                  </p>
                  <p className="break-all">
                    YouTube 채널:{" "}
                    {recovery.ownerResolution.youtubeChannelId ??
                      "채널 없음"}
                  </p>
                </div>
              ) : null}
              {recovery.youtubeOnlyRecovery.present ? (
                <div
                  data-testid="wizard-youtube-only-recovery-overlay"
                  className={`mt-2 rounded border px-2 py-1.5 text-xs ${
                    recovery.state === "complete" &&
                    recovery.youtubeOnlyRecovery.valid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  <p className="font-bold">
                    YouTube-only 복구 증거{" "}
                    {recovery.youtubeOnlyRecovery.valid
                      ? "무결성 확인"
                      : "수동 확인 필요"}
                  </p>
                  <p className="mt-1 break-all">
                    {recovery.youtubeOnlyRecovery.reason}
                  </p>
                  <dl className="mt-1 grid gap-x-3 gap-y-0.5 sm:grid-cols-2">
                    <div>
                      <dt className="inline font-bold">결과: </dt>
                      <dd className="inline">
                        {recovery.youtubeOnlyRecovery.status ??
                          "최종 result 없음"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">복구 기록: </dt>
                      <dd className="inline">
                        {recovery.youtubeOnlyRecovery.eventCount}건
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">마지막 단계: </dt>
                      <dd className="inline">
                        {recovery.youtubeOnlyRecovery.latestTransition
                          ? PUBLISH_ATTEMPT_TRANSITION_LABEL[
                              recovery.youtubeOnlyRecovery
                                .latestTransition
                            ] ??
                            recovery.youtubeOnlyRecovery
                              .latestTransition
                          : "없음"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">YouTube ID: </dt>
                      <dd className="inline break-all">
                        {recovery.youtubeOnlyRecovery.youtubeVideoId ??
                          "확정되지 않음"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">원장 잠금 정리: </dt>
                      <dd className="inline">
                        {recovery.youtubeOnlyRecovery
                          .writeLockReleased === true
                          ? "완료"
                          : recovery.youtubeOnlyRecovery
                                .writeLockReleased === false
                            ? "수동 확인 필요"
                            : "해당 없음"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">result 지문: </dt>
                      <dd className="inline break-all">
                        {recovery.youtubeOnlyRecovery
                          .resultFingerprint ?? "없음"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-1 font-semibold">
                    자동 재시도·자동 재업로드 0회
                  </p>
                </div>
              ) : null}
              {isOwnerReconciliationPart(recovery.partId) &&
              recovery.state === "ambiguous" &&
              recovery.reason ===
                "youtube_publish_outcome_unknown" &&
              recovery.instagramMediaId != null &&
              recovery.youtubeVideoId == null &&
              recovery.attemptEvidence.present &&
              recovery.attemptEvidence.journalValid &&
              recovery.recoveryFingerprint != null ? (
                <PublishOwnerReconciliationForm
                  topicId={topicId}
                  recovery={recovery}
                  disabled={disabled}
                  onResolved={onResolved}
                />
              ) : null}
              <details
                data-testid="wizard-publish-reconciliation-packet"
                className="mt-2 rounded border border-amber-200 bg-white/70 px-2 py-1.5 text-xs text-slate-700"
              >
                <summary className="cursor-pointer font-bold text-amber-900">
                  Owner 수동 대조 판단 패킷 보기
                </summary>
                <p className="mt-1 leading-relaxed">
                  {recovery.reconciliationPacket.conclusion}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="font-bold">확인된 사실</p>
                  {recovery.reconciliationPacket.confirmedFacts.map((item) => (
                    <p key={item.id} className="break-all">
                      · {item.label}{item.value ? ` (${item.value})` : ""}
                    </p>
                  ))}
                </div>
                {recovery.reconciliationPacket.uncertainFacts.length > 0 ? (
                  <div className="mt-2 space-y-1 text-amber-800">
                    <p className="font-bold">불명확한 사실</p>
                    {recovery.reconciliationPacket.uncertainFacts.map((item) => (
                      <p key={item.id} className="break-all">
                        · {item.label}{item.value ? ` (${item.value})` : ""}
                      </p>
                    ))}
                  </div>
                ) : null}
                <div className="mt-2 space-y-1">
                  <p className="font-bold">Owner 확인 필요</p>
                  {recovery.reconciliationPacket.ownerReview.map((item) => (
                    <p key={item.id}>· {item.label}</p>
                  ))}
                </div>
                <p className="mt-2 font-semibold text-amber-800">
                  자동 재시도·자동 복구·외부 실행 0회
                </p>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({
  num,
  title,
  state,
  desc,
  children,
}: {
  num: number;
  title: string;
  state: RunState;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div data-testid={`wizard-step-${num}`} className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-5">
      <div className="flex items-start gap-3.5">
        <span className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-base font-bold shrink-0 mt-0.5">
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg text-slate-900">{title}</span>
            <StateBadge state={state} />
          </div>
          <p className="text-[15px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

const RUN_BTN =
  "px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-[15px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

// ── 메인 위저드 ───────────────────────────────────────────────────────────────

export default function VideoCreationWizard() {
  const [localDev, setLocalDev] = useState<boolean | null>(null);

  const [category, setCategory] = useState<"finance" | null>(null);
  const [financeSubtopic, setFinanceSubtopic] = useState<string>("all");

  const [topicState, setTopicState] = useState<RunState>("idle");
  const [topicResult, setTopicResult] = useState<OperatorResult | null>(null);
  const [topics, setTopics] = useState<WizardTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const selectedTopicIdRef = useRef<string | null>(null);
  const [uploadReadyState, setUploadReadyState] = useState<RunState>("idle");
  const [uploadReadyResult, setUploadReadyResult] = useState<OperatorResult | null>(null);
  const [uploadReadyItems, setUploadReadyItems] = useState<WizardUploadReadyItem[]>([]);
  const [uploadReadyQuery, setUploadReadyQuery] = useState("");
  const [editorialSummary, setEditorialSummary] = useState<WizardEditorialPreferenceSummary | null>(null);
  const [preferenceBusyId, setPreferenceBusyId] = useState<string | null>(null);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);

  const [scriptState, setScriptState] = useState<RunState>("idle");
  const [scriptResult, setScriptResult] = useState<OperatorResult | null>(null);
  const [script, setScript] = useState<WizardScript | null>(null);

  const [voiceState, setVoiceState] = useState<RunState>("idle");
  const [voiceResult, setVoiceResult] = useState<OperatorResult | null>(null);

  const [videoState, setVideoState] = useState<RunState>("idle");
  const [videoResult, setVideoResult] = useState<OperatorResult | null>(null);

  // 실제 제작 파이프라인 상태 — 대본 엔진 표시 + 실제 목소리/장면 이미지/최종 영상 + media gate.
  const [scriptEngine, setScriptEngine] = useState<WizardScriptEngine | null>(null);
  const [realMedia, setRealMedia] = useState<WizardRealMedia | null>(null);
  const [automationPlanState, setAutomationPlanState] = useState<RunState>("idle");
  const [automationPlanResult, setAutomationPlanResult] = useState<OperatorResult | null>(null);
  const [automationPlan, setAutomationPlan] = useState<WizardAutomationPlan | null>(null);
  const [automationExecutionGuard, setAutomationExecutionGuard] = useState<WizardAutomationExecutionGuard | null>(null);
  const [automationAdvanceState, setAutomationAdvanceState] = useState<RunState>("idle");
  const [automationAdvanceResult, setAutomationAdvanceResult] = useState<OperatorResult | null>(null);
  const [automationRecoveryState, setAutomationRecoveryState] = useState<RunState>("idle");
  const [automationRecoveryResult, setAutomationRecoveryResult] = useState<OperatorResult | null>(null);
  const [automationQueueState, setAutomationQueueState] = useState<RunState>("idle");
  const [automationQueueResult, setAutomationQueueResult] = useState<OperatorResult | null>(null);
  const [automationQueue, setAutomationQueue] = useState<WizardAutomationQueue | null>(null);
  const [automationQueueBusyTopicId, setAutomationQueueBusyTopicId] = useState<string | null>(null);
  const [safeSessionState, setSafeSessionState] = useState<RunState>("idle");
  const [safeSessionResult, setSafeSessionResult] = useState<OperatorResult | null>(null);
  const [safeSession, setSafeSession] = useState<WizardSafeSession | null>(null);
  const [safeSessionRecovery, setSafeSessionRecovery] = useState<WizardSafeSessionRecovery | null>(null);
  const [safeSessionCoordinator, setSafeSessionCoordinator] = useState<WizardSafeSessionCoordinator | null>(null);
  const [safeSessionClose, setSafeSessionClose] = useState<WizardSafeSessionCloseView | null>(null);
  const [safeSessionCap, setSafeSessionCap] = useState<1 | 2 | 3>(1);
  const [showAdvancedOperations, setShowAdvancedOperations] = useState(false);
  const [characterCast, setCharacterCast] = useState<WizardFinanceCharacterCast | null>(null);
  const [characterCastState, setCharacterCastState] = useState<RunState>("idle");
  const [characterCastResult, setCharacterCastResult] = useState<OperatorResult | null>(null);
  const [characterCastBusyId, setCharacterCastBusyId] = useState<string | null>(null);
  const [characterImageKey, setCharacterImageKey] = useState(0);
  const [realTtsState, setRealTtsState] = useState<RunState>("idle");
  const [realTtsResult, setRealTtsResult] = useState<OperatorResult | null>(null);
  const [realTtsApprovalState, setRealTtsApprovalState] =
    useState<RunState>("idle");
  const [realTtsApprovalResult, setRealTtsApprovalResult] =
    useState<OperatorResult | null>(null);
  const [confirmTtsListenedAllParts, setConfirmTtsListenedAllParts] =
    useState(false);
  const [confirmTtsVoiceQuality, setConfirmTtsVoiceQuality] =
    useState(false);
  const [confirmTtsDownstreamUse, setConfirmTtsDownstreamUse] =
    useState(false);
  const [confirmTtsApprovalText, setConfirmTtsApprovalText] = useState("");
  const [imagesState, setImagesState] = useState<RunState>("idle");
  const [imagesResult, setImagesResult] = useState<OperatorResult | null>(null);
  const [imageReviewState, setImageReviewState] = useState<RunState>("idle");
  const [imageReviewResult, setImageReviewResult] = useState<OperatorResult | null>(null);
  const [selectedFailedScenes, setSelectedFailedScenes] = useState<Record<string, boolean>>({});
  const [confirmImagesReviewedAll, setConfirmImagesReviewedAll] = useState(false);
  const [confirmImageVisualQuality, setConfirmImageVisualQuality] = useState(false);
  const [confirmImageDownstreamUse, setConfirmImageDownstreamUse] = useState(false);
  const [confirmImageApprovalText, setConfirmImageApprovalText] = useState("");
  const [confirmSelectedRegeneration, setConfirmSelectedRegeneration] = useState(false);
  const [confirmSelectedRegenerationText, setConfirmSelectedRegenerationText] = useState("");
  const [sceneImageKey, setSceneImageKey] = useState(0);
  const [flowMotionState, setFlowMotionState] = useState<RunState>("idle");
  const [flowMotionResult, setFlowMotionResult] = useState<OperatorResult | null>(null);
  const [flowMotion, setFlowMotion] = useState<WizardFlowMotionStatus | null>(null);
  const [flowMotionApprovalInputs, setFlowMotionApprovalInputs] = useState<Record<string, string>>({});
  const [flowMotionQaChecks, setFlowMotionQaChecks] = useState<Record<string, FlowMotionQaState>>({});
  const [flowMotionQaNotes, setFlowMotionQaNotes] = useState<Record<string, string>>({});
  const [finalVideoState, setFinalVideoState] = useState<RunState>("idle");
  const [finalVideoResult, setFinalVideoResult] = useState<OperatorResult | null>(null);
  const [finalVideoReviewState, setFinalVideoReviewState] =
    useState<RunState>("idle");
  const [finalVideoReviewResult, setFinalVideoReviewResult] =
    useState<OperatorResult | null>(null);
  const [confirmFinalVideosWatched, setConfirmFinalVideosWatched] =
    useState(false);
  const [
    confirmFinalPublishMetadataReviewed,
    setConfirmFinalPublishMetadataReviewed,
  ] = useState(false);
  const [confirmFinalExactFiles, setConfirmFinalExactFiles] =
    useState(false);
  const [confirmFinalVideoApprovalText, setConfirmFinalVideoApprovalText] =
    useState("");
  const [audioKey, setAudioKey] = useState(0);

  const [previewState, setPreviewState] = useState<RunState>("idle");
  const [previewResult, setPreviewResult] = useState<OperatorResult | null>(null);
  const [previewVideo, setPreviewVideo] = useState<WizardVideo | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const [preflightState, setPreflightState] = useState<RunState>("idle");
  const [preflightResult, setPreflightResult] = useState<OperatorResult | null>(null);

  // 실제 업로드 확인 게이트 상태 — 서버도 같은 값을 다시 검증한다.
  const [uploadState, setUploadState] = useState<RunState>("idle");
  const [uploadResult, setUploadResult] = useState<OperatorResult | null>(null);
  const [confirmReviewed, setConfirmReviewed] = useState(false);
  const [confirmDiscoveryReady, setConfirmDiscoveryReady] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    selectedTopicIdRef.current = selectedTopicId;
  }, [selectedTopicId]);

  // Playwright 주문형 운영과 브라우저 재시작 후 이어가기를 위한 로컬 전용 복원점.
  // topicId는 이후 모든 서버 action에서 다시 검증되며 파일 경로로 직접 사용되지 않는다.
  useEffect(() => {
    const resumeTopicId = new URLSearchParams(window.location.search).get("resumeTopicId")?.trim();
    if (!resumeTopicId || !/^[a-z0-9][a-z0-9_-]{2,180}$/i.test(resumeTopicId)) return;
    const resumeTimer = window.setTimeout(() => setSelectedTopicId(resumeTopicId), 0);
    return () => window.clearTimeout(resumeTimer);
  }, []);

  // 화면이 로컬 실행인지 배포 사이트인지 확인한다(부작용 없는 상태 조회).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/money-shorts/operator")
      .then((r) => r.json())
      .then((j: { raw?: { localDev?: boolean } }) => {
        if (!cancelled) setLocalDev(j.raw?.localDev === true);
      })
      .catch(() => {
        if (!cancelled) setLocalDev(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const anyRunning = [
    topicState,
    scriptState,
    voiceState,
    videoState,
    previewState,
    preflightState,
    uploadState,
    realTtsState,
    realTtsApprovalState,
    imagesState,
    imageReviewState,
    flowMotionState,
    finalVideoState,
    characterCastState,
  ].includes("running") || preferenceBusyId !== null;
  const runnable = localDev === true && !anyRunning;

  const selectedTopic = topics.find((t) => t.topicId === selectedTopicId) ?? null;
  const normalizedUploadReadyQuery = uploadReadyQuery.trim().toLocaleLowerCase("ko-KR");
  const filteredUploadReadyItems = uploadReadyItems.filter((item) =>
    !normalizedUploadReadyQuery || item.title.toLocaleLowerCase("ko-KR").includes(normalizedUploadReadyQuery),
  );
  const selectedUploadReadyItem =
    uploadReadyItems.find((item) => item.topicId === selectedTopicId) ?? null;
  const selectedPublishRecoveryStates =
    selectedUploadReadyItem?.recoveryStates ?? [];
  const publishRecoveryRequired =
    selectedUploadReadyItem?.status === "needs_attention" ||
    selectedPublishRecoveryStates.some(
      (recovery) =>
        recovery.manualRecoveryRequired ||
        recovery.genericDualUploadBlocked ||
        (recovery.state !== "not_started" && recovery.state !== "complete"),
    );

  // 실제 제작 파생 상태 — 대본 확정 → 실제 음성 → 장면 이미지 → 최종 영상 → media gate.
  const scriptFinalReady = (scriptState === "success" && script != null) || realMedia?.scriptEngine.finalReady === true;
  const characterCastReady = characterCast?.allSelected === true;
  // 서버는 주제의 소주제에서 담당 캐릭터를 결정하고, 선택 파일의 SHA-256까지 검증한 뒤에만 생성한다.
  const characterReferenceEngineReady = characterCastReady;
  const realTtsGenerated = realMedia?.realTts.ready === true;
  const realTtsReady = realMedia?.realTts.qualityAccepted === true;
  const realTtsApprovalReady =
    confirmTtsListenedAllParts &&
    confirmTtsVoiceQuality &&
    confirmTtsDownstreamUse &&
    confirmTtsApprovalText.trim() === "음성 승인";
  const realImagesReady = realMedia?.realImages.ready === true;
  const realImagesReviewable = realMedia?.realImages.reviewable === true;
  const imageSceneRows = (realMedia?.parts ?? []).flatMap((part) =>
    part.realImages.scenes.map((scene) => ({
      partId: part.id,
      partNumber: part.partNumber,
      totalParts: part.totalParts,
      imageSetSha256: part.realImages.manualVisualReview.imageSetSha256,
      ...scene,
      selectionKey: `${part.id}:${scene.sceneIndex}:${scene.imageSha256 ?? "missing"}`,
    })),
  );
  const selectedImageScenes = imageSceneRows.filter((scene) => selectedFailedScenes[scene.selectionKey] === true);
  const imageReviewApprovalReady =
    realImagesReviewable &&
    selectedImageScenes.length === 0 &&
    confirmImagesReviewedAll &&
    confirmImageVisualQuality &&
    confirmImageDownstreamUse &&
    confirmImageApprovalText.trim() === "이미지 승인";
  const selectedImageRegenerationReady =
    realImagesReviewable &&
    selectedImageScenes.length > 0 &&
    confirmSelectedRegeneration &&
    confirmSelectedRegenerationText.trim() === "선택 장면 재생성";
  const selectedFlowMotionSceneCount = flowMotion?.requiredCount ?? script?.scenes?.filter((scene) => scene.mediaStrategy === "veo_motion").length ?? 0;
  const flowMotionPrepared = flowMotion?.state !== "not_prepared" && flowMotion?.state !== undefined;
  const flowMotionReadyForRender = flowMotion?.readyForRender === true;
  const finalVideoReady = realMedia?.finalVideo.ready === true;
  const finalVideoOwnerApproved =
    realMedia?.finalVideo.ownerApproved === true;
  const expectedFinalVideoApprovalParts = (realMedia?.parts ?? [])
    .map((part) => ({
      partId: part.id,
      finalMp4Sha256: part.finalVideo.finalMp4Sha256 ?? "",
      publishMetadataSha256:
        part.finalVideo.publishMetadataSha256 ?? "",
    }))
    .sort((left, right) =>
      left.partId.localeCompare(right.partId),
    );
  const finalVideoIdentityKey = expectedFinalVideoApprovalParts
    .map(
      (part) =>
        `${part.partId}:${part.finalMp4Sha256}:${part.publishMetadataSha256}`,
    )
    .join("|");
  const finalVideoReviewReady =
    finalVideoReady &&
    expectedFinalVideoApprovalParts.length > 0 &&
    expectedFinalVideoApprovalParts.every(
      (part) =>
        /^[a-f0-9]{64}$/.test(part.finalMp4Sha256) &&
        /^[a-f0-9]{64}$/.test(part.publishMetadataSha256),
    ) &&
    confirmFinalVideosWatched &&
    confirmFinalPublishMetadataReviewed &&
    confirmFinalExactFiles &&
    confirmFinalVideoApprovalText.trim() === "최종 영상 승인";
  const mediaGateOk = realMedia?.mediaQualityGate.ok === true;
  const productionPartCount = realMedia?.production.totalParts ?? script?.videoStrategy?.parts.length ?? 1;
  const effectiveVideoStrategyMode = realMedia?.production.mode ?? script?.videoStrategy?.mode ?? null;
  const videoStrategyDisplayMismatch =
    script?.videoStrategy != null &&
    realMedia?.production != null &&
    (script.videoStrategy.mode !== realMedia.production.mode ||
      script.videoStrategy.parts.length !== realMedia.production.totalParts);
  const plannedSceneCount = realMedia?.realImages.expectedCount ?? script?.scenes?.length ?? null;
  const imageStepDescription = plannedSceneCount != null
    ? `영상 ${productionPartCount}개, 총 ${plannedSceneCount}장면을 모두 미리 보고 실패 장면만 다시 만든 뒤 현재 이미지 세트를 승인합니다.`
    : "확정 대본의 장면 이미지를 모두 미리 보고 실패 장면만 다시 만든 뒤 현재 이미지 세트를 승인합니다.";
  const finalVideoStepDescription = plannedSceneCount != null
    ? `실제 목소리와 장면 이미지 ${plannedSceneCount}장에 검수 완료 Veo 모션 장면을 결합해 최종 mp4 ${productionPartCount}개로 합성합니다.`
    : "확정 대본의 실제 목소리·장면 이미지와 검수 완료 Veo 모션을 최종 mp4로 합성합니다.";

  // 업로드 게이트 파생 상태 — 최종 영상(media gate) → 게시 전 점검 통과 → 명시 확인 순서를 강제한다.
  const preflightDone =
    finalVideoOwnerApproved &&
    mediaGateOk &&
    preflightState === "success";
  const uploadEnabled =
    runnable &&
    selectedTopicId != null &&
    !publishRecoveryRequired &&
    finalVideoOwnerApproved &&
    mediaGateOk &&
    preflightDone &&
    confirmReviewed &&
    confirmDiscoveryReady &&
    confirmPublish &&
    confirmText.trim() === "업로드" &&
    uploadState !== "success";

  // 주제(또는 카테고리)가 바뀌면 이후 단계 결과를 전부 리셋한다 — 다른 주제의 결과가 섞이지 않게.
  const resetDownstream = useCallback(() => {
    setScriptState("idle");
    setScriptResult(null);
    setScript(null);
    setScriptEngine(null);
    setRealMedia(null);
    setAutomationPlanState("idle");
    setAutomationPlanResult(null);
    setAutomationPlan(null);
    setAutomationExecutionGuard(null);
    setAutomationAdvanceState("idle");
    setAutomationAdvanceResult(null);
    setAutomationRecoveryState("idle");
    setAutomationRecoveryResult(null);
    setRealTtsState("idle");
    setRealTtsResult(null);
    setRealTtsApprovalState("idle");
    setRealTtsApprovalResult(null);
    setConfirmTtsListenedAllParts(false);
    setConfirmTtsVoiceQuality(false);
    setConfirmTtsDownstreamUse(false);
    setConfirmTtsApprovalText("");
    setImagesState("idle");
    setImagesResult(null);
    setImageReviewState("idle");
    setImageReviewResult(null);
    setSelectedFailedScenes({});
    setConfirmImagesReviewedAll(false);
    setConfirmImageVisualQuality(false);
    setConfirmImageDownstreamUse(false);
    setConfirmImageApprovalText("");
    setConfirmSelectedRegeneration(false);
    setConfirmSelectedRegenerationText("");
    setFlowMotionState("idle");
    setFlowMotionResult(null);
    setFlowMotion(null);
    setFlowMotionApprovalInputs({});
    setFlowMotionQaChecks({});
    setFlowMotionQaNotes({});
    setFinalVideoState("idle");
    setFinalVideoResult(null);
    setFinalVideoReviewState("idle");
    setFinalVideoReviewResult(null);
    setConfirmFinalVideosWatched(false);
    setConfirmFinalPublishMetadataReviewed(false);
    setConfirmFinalExactFiles(false);
    setConfirmFinalVideoApprovalText("");
    setVoiceState("idle");
    setVoiceResult(null);
    setVideoState("idle");
    setVideoResult(null);
    setPreviewState("idle");
    setPreviewResult(null);
    setPreviewVideo(null);
    setPreflightState("idle");
    setPreflightResult(null);
    setUploadState("idle");
    setUploadResult(null);
    setConfirmReviewed(false);
    setConfirmDiscoveryReady(false);
    setConfirmPublish(false);
    setConfirmText("");
  }, []);

  const selectCategory = useCallback(
    (id: "finance") => {
      setCategory(id);
      setFinanceSubtopic("all");
      setTopics([]);
      setSelectedTopicId(null);
      setTopicState("idle");
      setTopicResult(null);
      setPreferenceMessage(null);
      resetDownstream();
    },
    [resetDownstream],
  );

  const selectFinanceSubtopic = useCallback(
    (id: string) => {
      setFinanceSubtopic(id);
      setTopics([]);
      setSelectedTopicId(null);
      setTopicState("idle");
      setTopicResult(null);
      setPreferenceMessage(null);
      resetDownstream();
    },
    [resetDownstream],
  );

  const selectTopic = useCallback(
    (topicId: string) => {
      setSelectedTopicId(topicId);
      resetDownstream();
    },
    [resetDownstream],
  );

  const refreshUploadReadyList = useCallback(async () => {
    setUploadReadyState("running");
    try {
      const r = await postAction("uploadReadyList");
      const items = (r.raw as { items?: WizardUploadReadyItem[] } | undefined)?.items;
      setUploadReadyResult(r);
      setUploadReadyState(r.status === "success" ? "success" : r.status);
      if (r.status === "success" && Array.isArray(items)) setUploadReadyItems(items);
    } catch {
      setUploadReadyState("error");
      setUploadReadyResult({ action: "uploadReadyList", status: "error", summary: "완성 영상 목록을 불러오지 못했습니다." });
    }
  }, []);

  const refreshCharacterCast = useCallback(async () => {
    try {
      const result = await postAction("characterCastStatus");
      const cast = (result.raw as { cast?: WizardFinanceCharacterCast } | undefined)?.cast;
      if (result.status === "success" && cast) setCharacterCast(cast);
    } catch {
      // 초기 상태 조회 실패는 후보 생성 버튼에서 다시 확인한다.
    }
  }, []);

  const createCharacterCandidates = useCallback(async (characterId: string, regenerate = false) => {
    setCharacterCastBusyId(characterId);
    setCharacterCastState("running");
    setCharacterCastResult(null);
    try {
      const result = await postAction("characterCastCreate", { characterId, regenerate });
      const cast = (result.raw as { cast?: WizardFinanceCharacterCast } | undefined)?.cast;
      if (cast) setCharacterCast(cast);
      setCharacterImageKey((key) => key + 1);
      setCharacterCastResult(result);
      setCharacterCastState(result.status === "success" ? "success" : result.status);
    } catch {
      setCharacterCastState("error");
      setCharacterCastResult({ action: "characterCastCreate", status: "error", summary: "주인공 후보 이미지 생성 요청에 실패했습니다." });
    } finally {
      setCharacterCastBusyId(null);
    }
  }, []);

  const selectCharacterCandidate = useCallback(async (characterId: string, candidateNumber: number) => {
    setCharacterCastBusyId(characterId);
    setCharacterCastState("running");
    setCharacterCastResult(null);
    try {
      const result = await postAction("characterCastSelect", { characterId, candidateNumber });
      const cast = (result.raw as { cast?: WizardFinanceCharacterCast } | undefined)?.cast;
      if (cast) setCharacterCast(cast);
      setCharacterCastResult(result);
      setCharacterCastState(result.status === "success" ? "success" : result.status);
    } catch {
      setCharacterCastState("error");
      setCharacterCastResult({ action: "characterCastSelect", status: "error", summary: "주인공 기준 이미지 선택을 저장하지 못했습니다." });
    } finally {
      setCharacterCastBusyId(null);
    }
  }, []);

  const selectUploadReadyItem = useCallback((item: WizardUploadReadyItem) => {
    setCategory(item.category);
    setFinanceSubtopic("all");
    setTopics((current) => current.some((topic) => topic.topicId === item.topicId)
      ? current
      : [{
          topicId: item.topicId,
          title: item.title,
          hook: item.title,
          reason: "완성 영상 불러오기",
          scriptReady: true,
          recommended: false,
          category: item.category,
        }, ...current]);
    setSelectedTopicId(item.topicId);
    resetDownstream();
    window.history.replaceState(null, "", `/money-shorts?resumeTopicId=${encodeURIComponent(item.topicId)}`);
  }, [resetDownstream]);

  // ── 단계 실행 핸들러 ─────────────────────────────────────────────────────────

  const runTopicRecommend = useCallback(async () => {
    if (!category) return;
    setTopicState("running");
    setTopicResult(null);
    try {
      const r = await postAction("topicRecommend", {
        category,
        financeSubtopic: category === "finance" && financeSubtopic !== "all" ? financeSubtopic : undefined,
      });
      setTopicResult(r);
      setTopicState(r.status === "success" ? "success" : r.status);
      const list = (r.raw as { topics?: WizardTopic[] } | undefined)?.topics;
      if (r.status === "success" && Array.isArray(list)) {
        setTopics(list);
        const raw = r.raw as { editorialSummary?: WizardEditorialPreferenceSummary } | undefined;
        if (raw?.editorialSummary) setEditorialSummary(raw.editorialSummary);
        // 편집 후보는 Owner가 '만든다'로 판정하기 전에는 제작 주제로 자동 선택하지 않는다.
        setSelectedTopicId(list[0]?.requiresEditorialDecision ? null : (list[0]?.topicId ?? null));
        setPreferenceMessage(null);
        resetDownstream();
      }
    } catch (error) {
      setTopicState("error");
      setTopicResult({
        action: "topicRecommend",
        status: "error",
        summary:
          error instanceof Error && error.name === "AbortError"
            ? "주제 추천 시간이 초과됐습니다. 다시 눌러 주세요."
            : "주제 추천 요청에 실패했습니다.",
      });
    }
  }, [category, financeSubtopic, resetDownstream]);

  const runTopicPreference = useCallback(
    async (topicId: string, decision: "make" | "maybe" | "reject") => {
      setPreferenceBusyId(topicId);
      setPreferenceMessage(null);
      try {
        const r = await postAction("topicPreference", { topicId, decision });
        if (r.status !== "success") {
          setPreferenceMessage(r.summary);
          return;
        }
        const raw = r.raw as {
          topic?: WizardTopic;
          editorialSummary?: WizardEditorialPreferenceSummary;
        } | undefined;
        if (raw?.topic) {
          setTopics((current) => current.map((topic) => (topic.topicId === topicId ? { ...topic, ...raw.topic } : topic)));
        }
        if (raw?.editorialSummary) setEditorialSummary(raw.editorialSummary);
        if (decision === "make") {
          setSelectedTopicId(topicId);
          resetDownstream();
        } else if (selectedTopicId === topicId) {
          setSelectedTopicId(null);
          resetDownstream();
        }
        setPreferenceMessage(r.summary);
      } catch {
        setPreferenceMessage("편집 판정 저장 요청에 실패했습니다.");
      } finally {
        setPreferenceBusyId(null);
      }
    },
    [resetDownstream, selectedTopicId],
  );

  // 실제 미디어 준비 상태(media quality gate)를 조회한다 — 읽기 전용, 언제든 안전.
  const refreshRealMedia = useCallback(async (topicId: string) => {
    try {
      const r = await postAction("realMediaStatus", { topicId });
      const raw = r.raw as { media?: WizardRealMedia; flowMotion?: WizardFlowMotionStatus } | undefined;
      if (selectedTopicIdRef.current !== topicId) return;
      if (r.status === "success" && raw?.media) setRealMedia(raw.media);
      if (r.status === "success" && raw?.flowMotion) setFlowMotion(raw.flowMotion);
    } catch {
      // 상태 조회 실패는 조용히 무시(다음 단계 버튼이 다시 조회한다).
    }
  }, []);

  const refreshAutomationPlan = useCallback(async (topicId: string) => {
    setAutomationPlanState("running");
    setAutomationExecutionGuard(null);
    try {
      const r = await postAction("automationPlan", { topicId });
      const raw = r.raw as { plan?: WizardAutomationPlan; executionGuard?: WizardAutomationExecutionGuard } | undefined;
      const plan = raw?.plan;
      setAutomationPlanResult(r);
      setAutomationPlanState(r.status === "success" ? "success" : r.status);
      setAutomationPlan(r.status === "success" && plan ? plan : null);
      setAutomationExecutionGuard(r.status === "success" && raw?.executionGuard ? raw.executionGuard : null);
    } catch {
      setAutomationPlanState("error");
      setAutomationPlanResult({ action: "automationPlan", status: "error", summary: "자동 진행 상태를 확인하지 못했습니다." });
      setAutomationPlan(null);
      setAutomationExecutionGuard(null);
    }
  }, []);

  const refreshAutomationQueue = useCallback(async () => {
    setAutomationQueueState("running");
    try {
      const r = await postAction("automationQueueStatus");
      const queue = (r.raw as { queue?: WizardAutomationQueue } | undefined)?.queue;
      setAutomationQueueResult(r);
      setAutomationQueueState(r.status === "success" ? "success" : r.status);
      setAutomationQueue(r.status === "success" && queue ? queue : null);
    } catch {
      setAutomationQueueState("error");
      setAutomationQueueResult({ action: "automationQueueStatus", status: "error", summary: "자동 작업 큐를 불러오지 못했습니다." });
      setAutomationQueue(null);
    }
  }, []);

  const refreshSafeSession = useCallback(async () => {
    setSafeSessionState("running");
    try {
      const r = await postAction("safeSessionStatus");
      const raw = r.raw as {
        session?: WizardSafeSession;
        recovery?: WizardSafeSessionRecovery;
        coordination?: WizardSafeSessionCoordinator;
        close?: WizardSafeSessionCloseView;
      } | undefined;
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
      setSafeSession(r.status === "success" && raw?.session ? raw.session : null);
      setSafeSessionRecovery(r.status === "success" && raw?.recovery ? raw.recovery : null);
      setSafeSessionCoordinator(r.status === "success" && raw?.coordination ? raw.coordination : null);
      setSafeSessionClose(r.status === "success" && raw?.close ? raw.close : null);
    } catch {
      setSafeSessionState("error");
      setSafeSessionResult({ action: "safeSessionStatus", status: "error", summary: "안전 세션 상태를 불러오지 못했습니다." });
      setSafeSession(null);
      setSafeSessionRecovery(null);
      setSafeSessionCoordinator(null);
      setSafeSessionClose(null);
    }
  }, []);

  const startSafeSession = useCallback(async () => {
    if (safeSessionState === "running" || safeSession?.currentSession != null) return;
    setSafeSessionState("running");
    setSafeSessionResult(null);
    try {
      const r = await postAction("safeSessionStart", { maxActionCount: safeSessionCap });
      await refreshSafeSession();
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
    } catch {
      setSafeSessionState("error");
      setSafeSessionResult({ action: "safeSessionStart", status: "error", summary: "안전 세션 시작 의도를 기록하지 못했습니다." });
    }
  }, [refreshSafeSession, safeSession?.currentSession, safeSessionCap, safeSessionState]);

  const stopSafeSession = useCallback(async () => {
    const sessionId = safeSession?.currentSession?.sessionId;
    if (!sessionId || safeSessionState === "running") return;
    setSafeSessionState("running");
    setSafeSessionResult(null);
    try {
      const r = await postAction("safeSessionStop", { sessionId });
      await refreshSafeSession();
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
    } catch {
      setSafeSessionState("error");
      setSafeSessionResult({ action: "safeSessionStop", status: "error", summary: "안전 세션 중지 요청을 기록하지 못했습니다." });
    }
  }, [refreshSafeSession, safeSession?.currentSession?.sessionId, safeSessionState]);

  const closeSafeSession = useCallback(async () => {
    const sessionId = safeSession?.currentSession?.sessionId;
    const close = safeSessionClose;
    if (
      !sessionId ||
      safeSessionState === "running" ||
      close?.eligible !== true ||
      close.sessionId !== sessionId ||
      !close.closeFingerprint
    ) return;

    const confirmed = window.confirm(
      "이 안전 세션을 요약 이력으로 보관하고 종료할까요?\n\n현재 작업은 실행하지 않으며, 종료 뒤 새 안전 세션을 시작할 수 있습니다.",
    );
    if (!confirmed) return;

    setSafeSessionState("running");
    setSafeSessionResult(null);
    try {
      const r = await postAction("safeSessionClose", {
        sessionId,
        closeFingerprint: close.closeFingerprint,
        confirmation: SAFE_SESSION_CLOSE_CONFIRM_TEXT,
      });
      await refreshSafeSession();
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
    } catch {
      setSafeSessionState("error");
      setSafeSessionResult({ action: "safeSessionClose", status: "error", summary: "안전 세션을 보관 종료하지 못했습니다." });
    }
  }, [refreshSafeSession, safeSession?.currentSession?.sessionId, safeSessionClose, safeSessionState]);

  const runSafeSessionNext = useCallback(async () => {
    const sessionId = safeSession?.currentSession?.sessionId;
    const coordination = safeSessionCoordinator;
    const claim = coordination?.nextClaim;
    if (
      !sessionId ||
      safeSessionState === "running" ||
      safeSession?.currentSession?.actionInFlight === true ||
      safeSessionRecovery?.state !== "inactive" ||
      coordination?.state !== "ready" ||
      coordination.sessionId !== sessionId ||
      coordination.actionPlannedCount !== 1 ||
      !coordination.coordinatorFingerprint ||
      !coordination.queuePreviewFingerprint ||
      claim == null
    ) return;

    const confirmed = window.confirm(
      `${claim.topicId}의 ${claim.action} 작업을 정확히 1회 실행할까요?\n\n두 번째 작업·자동 재시도·유료 생성·업로드는 이어서 실행하지 않습니다.`,
    );
    if (!confirmed) return;

    setSafeSessionState("running");
    setSafeSessionResult(null);
    try {
      const r = await postAction("safeSessionRunNext", {
        sessionId,
        coordinatorFingerprint: coordination.coordinatorFingerprint,
        queuePreviewFingerprint: coordination.queuePreviewFingerprint,
        confirmation: SAFE_SESSION_RUN_CONFIRM_TEXT,
      });
      const raw = r.raw as {
        executorResult?: {
          raw?: {
            executedAction?: string;
          };
        };
      } | undefined;
      await refreshSafeSession();
      await refreshAutomationQueue();
      if (selectedTopicId === claim.topicId) {
        await refreshRealMedia(claim.topicId);
        await refreshAutomationPlan(claim.topicId);
      }
      if (raw?.executorResult?.raw?.executedAction === "finalVideoCreate" && r.status === "success") {
        setPreviewKey((key) => key + 1);
      }
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
    } catch {
      const failure: OperatorResult = {
        action: "safeSessionRunNext",
        status: "error",
        summary: "안전 세션의 단일 작업을 실행하지 못했습니다. 자동 재시도하지 않습니다.",
      };
      await refreshSafeSession();
      setSafeSessionState("error");
      setSafeSessionResult(failure);
    }
  }, [
    refreshAutomationPlan,
    refreshAutomationQueue,
    refreshRealMedia,
    refreshSafeSession,
    safeSession?.currentSession?.actionInFlight,
    safeSession?.currentSession?.sessionId,
    safeSessionCoordinator,
    safeSessionRecovery?.state,
    safeSessionState,
    selectedTopicId,
  ]);

  const runSafeSessionBounded = useCallback(async () => {
    const currentSession = safeSession?.currentSession;
    const sessionId = currentSession?.sessionId;
    const coordination = safeSessionCoordinator;
    const claim = coordination?.nextClaim;
    if (
      !sessionId ||
      safeSessionState === "running" ||
      currentSession?.status !== "ready" ||
      currentSession.actionInFlight === true ||
      currentSession.completedActionCount >= currentSession.maxActionCount ||
      safeSessionRecovery?.state !== "inactive" ||
      coordination?.state !== "ready" ||
      coordination.sessionId !== sessionId ||
      coordination.actionPlannedCount !== 1 ||
      !coordination.coordinatorFingerprint ||
      !coordination.queuePreviewFingerprint ||
      claim == null
    ) return;

    const remainingActionCount = Math.min(
      3,
      currentSession.maxActionCount - currentSession.completedActionCount,
    );
    const confirmed = window.confirm(
      `${claim.topicId}의 ${claim.action} 작업부터 최대 ${remainingActionCount}회 실행할까요?\n\n매 회차 세션·큐·지문을 다시 확인합니다. 첫 실패·증거 변경·Owner 확인 단계·상한에서 즉시 멈추며 자동 재시도·유료 생성·QA 판정·업로드·게시는 실행하지 않습니다.`,
    );
    if (!confirmed) return;

    setSafeSessionState("running");
    setSafeSessionResult(null);
    try {
      const r = await postAction("safeSessionRunBounded", {
        sessionId,
        coordinatorFingerprint: coordination.coordinatorFingerprint,
        queuePreviewFingerprint: coordination.queuePreviewFingerprint,
        confirmation: SAFE_SESSION_BOUNDED_RUN_CONFIRM_TEXT,
      });
      const raw = r.raw as {
        steps?: Array<{
          topicId?: string | null;
          action?: string | null;
        }>;
      } | undefined;
      await refreshSafeSession();
      await refreshAutomationQueue();
      if (
        selectedTopicId &&
        raw?.steps?.some((step) => step.topicId === selectedTopicId)
      ) {
        await refreshRealMedia(selectedTopicId);
        await refreshAutomationPlan(selectedTopicId);
      }
      if (
        raw?.steps?.some(
          (step) => step.topicId === selectedTopicId && step.action === "finalVideoCreate",
        ) &&
        r.status === "success"
      ) {
        setPreviewKey((key) => key + 1);
      }
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
    } catch {
      const failure: OperatorResult = {
        action: "safeSessionRunBounded",
        status: "error",
        summary: "로컬 최대 3회 실행을 중단했습니다. 자동 재시도하지 않습니다.",
      };
      await refreshSafeSession();
      await refreshAutomationQueue();
      setSafeSessionState("error");
      setSafeSessionResult(failure);
    }
  }, [
    refreshAutomationPlan,
    refreshAutomationQueue,
    refreshRealMedia,
    refreshSafeSession,
    safeSession?.currentSession,
    safeSessionCoordinator,
    safeSessionRecovery?.state,
    safeSessionState,
    selectedTopicId,
  ]);

  const resolveSafeSessionRecovery = useCallback(async (
    decision: WizardSafeSessionDirectRecoveryDecision,
  ) => {
    const sessionId = safeSession?.currentSession?.sessionId;
    const recovery = safeSessionRecovery;
    if (
      !sessionId ||
      safeSessionState === "running" ||
      recovery?.state !== "decision_required" ||
      recovery.allowedDecision !== decision ||
      recovery.ownerConfirmationRequired !== true ||
      recovery.executionRecoveryDecision != null ||
      !recovery.recoveryFingerprint
    ) return;

    const confirmed = window.confirm(
      decision === "terminalize_session_from_receipt"
        ? "현재 claim과 정확히 일치하는 종료 영수증으로 안전 세션 작업 1회를 종결할까요? 작업 자체를 다시 실행하지 않습니다."
        : "현재 증거와 일치하는 중단 claim을 해제하고 안전 세션을 중지할까요? 작업 자체를 실행하지 않습니다.",
    );
    if (!confirmed) return;

    setSafeSessionState("running");
    setSafeSessionResult(null);
    try {
      const r = await postAction("safeSessionRecoveryResolve", {
        sessionId,
        recoveryFingerprint: recovery.recoveryFingerprint,
        decision,
        confirmation: SAFE_SESSION_RECOVERY_CONFIRM_TEXT[decision],
      });
      const raw = r.raw as {
        session?: WizardSafeSession;
        recovery?: WizardSafeSessionRecovery;
      } | undefined;
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
      if (raw?.session) setSafeSession(raw.session);
      if (raw?.recovery) setSafeSessionRecovery(raw.recovery);
      await refreshSafeSession();
      setSafeSessionResult(r);
      setSafeSessionState(r.status === "success" ? "success" : r.status);
    } catch {
      setSafeSessionState("error");
      setSafeSessionResult({
        action: "safeSessionRecoveryResolve",
        status: "error",
        summary: "안전 세션 복구를 기록하지 못했습니다. 기존 claim 잠금은 유지됩니다.",
      });
    }
  }, [refreshSafeSession, safeSession?.currentSession?.sessionId, safeSessionRecovery, safeSessionState]);

  const enqueueCurrentAutomationTopic = useCallback(async () => {
    if (!selectedTopicId || !automationPlan) return;
    setAutomationQueueState("running");
    try {
      const r = await postAction("automationQueueEnqueue", {
        topicId: selectedTopicId,
        title: selectedTopic?.title ?? script?.title ?? selectedTopicId,
      });
      const queue = (r.raw as { queue?: WizardAutomationQueue } | undefined)?.queue;
      setAutomationQueueResult(r);
      setAutomationQueueState(r.status === "success" ? "success" : r.status);
      if (queue) setAutomationQueue(queue);
    } catch {
      setAutomationQueueState("error");
      setAutomationQueueResult({ action: "automationQueueEnqueue", status: "error", summary: "선택한 주제를 작업 큐에 저장하지 못했습니다." });
    }
  }, [automationPlan, script?.title, selectedTopic?.title, selectedTopicId]);

  const runAutomationAdvance = useCallback(async () => {
    if (!selectedTopicId || automationPlan?.next?.canAutoAdvance !== true) return;
    setAutomationAdvanceState("running");
    setAutomationAdvanceResult(null);
    try {
      const r = await postAction("automationAdvance", { topicId: selectedTopicId });
      const raw = r.raw as {
        planAfter?: WizardAutomationPlan;
        executedAction?: string;
        executionGuard?: WizardAutomationExecutionGuard;
      } | undefined;
      if (raw?.planAfter) setAutomationPlan(raw.planAfter);
      if (raw?.executionGuard) setAutomationExecutionGuard(raw.executionGuard);
      setAutomationAdvanceResult(r);
      setAutomationAdvanceState(r.status === "success" ? "success" : r.status);
      if (raw?.executedAction === "finalVideoCreate" && r.status === "success") {
        setPreviewKey((key) => key + 1);
      }
      await refreshRealMedia(selectedTopicId);
      await refreshAutomationPlan(selectedTopicId);
      await refreshAutomationQueue();
    } catch {
      setAutomationAdvanceState("error");
      setAutomationAdvanceResult({
        action: "automationAdvance",
        status: "error",
        summary: "다음 안전 작업 1개를 실행하지 못했습니다. 자동 재시도하지 않습니다.",
      });
    }
  }, [selectedTopicId, automationPlan?.next?.canAutoAdvance, refreshAutomationPlan, refreshAutomationQueue, refreshRealMedia]);

  const runSelectedQueueAdvance = useCallback(async () => {
    const preview = automationQueue?.runPreview;
    const selected = preview?.selected;
    if (!selected || !preview.previewFingerprint) return;
    setAutomationQueueBusyTopicId(selected.topicId);
    setAutomationQueueState("running");
    setAutomationQueueResult(null);
    try {
      const r = await postAction("automationQueueRunSelected", {
        previewFingerprint: preview.previewFingerprint,
        jobId: selected.jobId,
        topicId: selected.topicId,
        selectedAction: selected.action,
        planFingerprint: selected.planFingerprint,
      });
      const queue = (r.raw as { queue?: WizardAutomationQueue } | undefined)?.queue;
      if (queue) setAutomationQueue(queue);
      else await refreshAutomationQueue();
      setAutomationQueueResult(r);
      setAutomationQueueState(r.status === "success" ? "success" : r.status);
      if (selectedTopicId === selected.topicId) {
        await refreshRealMedia(selected.topicId);
        await refreshAutomationPlan(selected.topicId);
      }
    } catch {
      setAutomationQueueState("error");
      setAutomationQueueResult({
        action: "automationQueueRunSelected",
        status: "error",
        summary: "큐의 안전 작업을 실행하지 못했습니다. 자동 재시도하지 않습니다.",
      });
    } finally {
      setAutomationQueueBusyTopicId(null);
    }
  }, [automationQueue, refreshAutomationPlan, refreshAutomationQueue, refreshRealMedia, selectedTopicId]);

  const updateAutomationQueueLifecycle = useCallback(async (
    action: "automationQueuePause" | "automationQueueResume" | "automationQueueRemove" | "automationQueueArchiveCompleted",
    job: WizardAutomationQueueJob,
  ) => {
    if (automationQueueState === "running" || automationQueueBusyTopicId != null) return;
    setAutomationQueueBusyTopicId(job.topicId);
    setAutomationQueueState("running");
    setAutomationQueueResult(null);
    try {
      const r = await postAction(action, { topicId: job.topicId });
      const queue = (r.raw as { queue?: WizardAutomationQueue } | undefined)?.queue;
      if (queue) setAutomationQueue(queue);
      else await refreshAutomationQueue();
      setAutomationQueueResult(r);
      setAutomationQueueState(r.status === "success" ? "success" : r.status);
      if (selectedTopicId === job.topicId) await refreshAutomationPlan(job.topicId);
    } catch {
      setAutomationQueueState("error");
      setAutomationQueueResult({ action, status: "error", summary: "큐 lifecycle 변경을 기록하지 못했습니다. 제작 작업은 실행되지 않았습니다." });
    } finally {
      setAutomationQueueBusyTopicId(null);
    }
  }, [automationQueueBusyTopicId, automationQueueState, refreshAutomationPlan, refreshAutomationQueue, selectedTopicId]);

  const moveAutomationQueuePriority = useCallback(async (
    job: WizardAutomationQueueJob,
    direction: "earlier" | "later",
  ) => {
    if (automationQueueState === "running" || automationQueueBusyTopicId != null) return;
    setAutomationQueueBusyTopicId(job.topicId);
    setAutomationQueueState("running");
    setAutomationQueueResult(null);
    try {
      const r = await postAction("automationQueueMovePriority", { topicId: job.topicId, direction });
      const queue = (r.raw as { queue?: WizardAutomationQueue } | undefined)?.queue;
      if (queue) setAutomationQueue(queue);
      else await refreshAutomationQueue();
      setAutomationQueueResult(r);
      setAutomationQueueState(r.status === "success" ? "success" : r.status);
    } catch {
      setAutomationQueueState("error");
      setAutomationQueueResult({ action: "automationQueueMovePriority", status: "error", summary: "큐 우선순위를 변경하지 못했습니다. 제작 작업은 실행되지 않았습니다." });
    } finally {
      setAutomationQueueBusyTopicId(null);
    }
  }, [automationQueueBusyTopicId, automationQueueState, refreshAutomationQueue]);

  const resolveAutomationRecovery = useCallback(async (
    decision: "acknowledge_artifacts_advanced" | "clear_for_manual_retry",
  ) => {
    const recovery = automationExecutionGuard?.recovery;
    const receipt = recovery?.receipt;
    if (
      !selectedTopicId ||
      recovery?.status !== "decision_required" ||
      recovery.allowedDecision !== decision ||
      !recovery.currentPlanFingerprint ||
      !receipt?.executionId
    ) return;

    const confirmed = window.confirm(
      decision === "acknowledge_artifacts_advanced"
        ? "현재 산출물 단계가 중단 전보다 전진했습니다. 실행을 다시 하지 않고 완료 확인 기록만 남길까요?"
        : "현재 산출물 단계가 중단 전과 같습니다. 지금 작업을 실행하지 않고 잠금만 해제해 나중에 수동 재시도를 허용할까요?",
    );
    if (!confirmed) return;

    setAutomationRecoveryState("running");
    setAutomationRecoveryResult(null);
    try {
      const r = await postAction("automationRecoveryResolve", {
        topicId: selectedTopicId,
        decision,
        executionId: receipt.executionId,
        currentPlanFingerprint: recovery.currentPlanFingerprint,
        confirmation: AUTOMATION_RECOVERY_CONFIRM_TEXT[decision],
      });
      setAutomationRecoveryResult(r);
      setAutomationRecoveryState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
      await refreshAutomationPlan(selectedTopicId);
      await refreshSafeSession();
    } catch {
      setAutomationRecoveryState("error");
      setAutomationRecoveryResult({
        action: "automationRecoveryResolve",
        status: "error",
        summary: "복구 결정을 기록하지 못했습니다. 잠금은 유지됩니다.",
      });
    }
  }, [automationExecutionGuard, refreshAutomationPlan, refreshRealMedia, refreshSafeSession, selectedTopicId]);

  useEffect(() => {
    if (localDev !== true) return;
    const listTimer = window.setTimeout(() => void refreshUploadReadyList(), 0);
    const castTimer = window.setTimeout(() => void refreshCharacterCast(), 0);
    const queueTimer = showAdvancedOperations
      ? window.setTimeout(() => void refreshAutomationQueue(), 0)
      : null;
    const safeSessionTimer = showAdvancedOperations
      ? window.setTimeout(() => void refreshSafeSession(), 0)
      : null;
    return () => {
      window.clearTimeout(listTimer);
      window.clearTimeout(castTimer);
      if (queueTimer != null) window.clearTimeout(queueTimer);
      if (safeSessionTimer != null) window.clearTimeout(safeSessionTimer);
    };
  }, [localDev, refreshAutomationQueue, refreshCharacterCast, refreshSafeSession, refreshUploadReadyList, showAdvancedOperations]);

  // 주제를 고르면 그 주제의 실제 제작 진행 상태를 복원한다(이전 세션 산출물 이어가기).
  useEffect(() => {
    if (localDev !== true || !selectedTopicId) return;
    const refreshTimer = window.setTimeout(() => {
      void refreshRealMedia(selectedTopicId);
    }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [localDev, selectedTopicId, refreshRealMedia]);

  // 이미지 파일 하나라도 바뀌어 image-set hash가 달라지면 이전 선택/확인 입력을 재사용하지 않는다.
  useEffect(() => {
    setImageReviewState("idle");
    setImageReviewResult(null);
    setSelectedFailedScenes({});
    setConfirmImagesReviewedAll(false);
    setConfirmImageVisualQuality(false);
    setConfirmImageDownstreamUse(false);
    setConfirmImageApprovalText("");
    setConfirmSelectedRegeneration(false);
    setConfirmSelectedRegenerationText("");
    setFlowMotionState("idle");
    setFlowMotionResult(null);
    setFlowMotionApprovalInputs({});
    setFlowMotionQaChecks({});
    setFlowMotionQaNotes({});
    setFinalVideoState("idle");
    setFinalVideoResult(null);
    setFinalVideoReviewState("idle");
    setFinalVideoReviewResult(null);
    setConfirmFinalVideosWatched(false);
    setConfirmFinalPublishMetadataReviewed(false);
    setConfirmFinalExactFiles(false);
    setConfirmFinalVideoApprovalText("");
    setPreflightState("idle");
    setPreflightResult(null);
    setConfirmReviewed(false);
    setConfirmDiscoveryReady(false);
    setConfirmPublish(false);
    setConfirmText("");
    setUploadState((current) => current === "success" ? current : "idle");
    setUploadResult((current) => current?.status === "success" ? current : null);
    setSceneImageKey((key) => key + 1);
  }, [selectedTopicId, realMedia?.realImages.manualVisualReview.imageSetSha256]);

  // 최종 MP4 바이트나 게시 문구 fingerprint가 하나라도 바뀌면 이전 최종 승인과
  // 게시 전 점검·미게시 확인 입력을 브라우저 상태에서도 즉시 재사용하지 않는다.
  useEffect(() => {
    setFinalVideoReviewState("idle");
    setFinalVideoReviewResult(null);
    setConfirmFinalVideosWatched(false);
    setConfirmFinalPublishMetadataReviewed(false);
    setConfirmFinalExactFiles(false);
    setConfirmFinalVideoApprovalText("");
    setPreflightState("idle");
    setPreflightResult(null);
    setConfirmReviewed(false);
    setConfirmDiscoveryReady(false);
    setConfirmPublish(false);
    setConfirmText("");
    setUploadState((current) =>
      current === "success" ? current : "idle",
    );
    setUploadResult((current) =>
      current?.status === "success" ? current : null,
    );
  }, [selectedTopicId, finalVideoIdentityKey]);

  // 실제 산출물 상태가 바뀔 때마다 서버가 다음 안전 단계를 다시 계산한다.
  // 이 조회는 어떤 생성·렌더·업로드도 실행하지 않는다.
  useEffect(() => {
    if (localDev !== true || !selectedTopicId) return;
    const refreshTimer = window.setTimeout(() => {
      void refreshAutomationPlan(selectedTopicId);
    }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [
    localDev,
    selectedTopicId,
    realMedia?.realTts.ready,
    realMedia?.realTts.qualityAccepted,
    realMedia?.realImages.generatedCount,
    realMedia?.realImages.manualVisualReview.imageSetSha256,
    realMedia?.realImages.ready,
    realMedia?.finalVideo.ready,
    realMedia?.finalVideo.ownerApproved,
    realMedia?.finalVideo.ownerApprovalFingerprint,
    realMedia?.mediaQualityGate.ok,
    flowMotion?.state,
    flowMotion?.readyForRender,
    preflightState,
    uploadState,
    refreshAutomationPlan,
  ]);

  const runScriptPreview = useCallback(async () => {
    if (!selectedTopicId) return;
    setScriptState("running");
    setScriptResult(null);
    setScript(null);
    setScriptEngine(null);
    try {
      const r = await postAction("scriptPreview", { topicId: selectedTopicId });
      setScriptResult(r);
      setScriptState(r.status === "success" ? "success" : r.status);
      const raw = r.raw as { script?: WizardScript; scriptEngine?: WizardScriptEngine } | undefined;
      if (raw?.script) setScript(raw.script);
      if (r.status === "success" && raw?.scriptEngine) setScriptEngine(raw.scriptEngine);
      if (r.status === "success") void refreshRealMedia(selectedTopicId);
    } catch {
      setScriptState("error");
      setScriptResult({ action: "scriptPreview", status: "error", summary: "대본 요청에 실패했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  // 실제 목소리 만들기 — Owner 클릭이 곧 실행 승인. 몇십 초 걸릴 수 있다.
  const runRealTts = useCallback(async () => {
    if (!selectedTopicId) return;
    setRealTtsState("running");
    setRealTtsResult(null);
    setRealTtsApprovalState("idle");
    setRealTtsApprovalResult(null);
    setConfirmTtsListenedAllParts(false);
    setConfirmTtsVoiceQuality(false);
    setConfirmTtsDownstreamUse(false);
    setConfirmTtsApprovalText("");
    try {
      const r = await postAction("realTtsCreate", { topicId: selectedTopicId });
      setRealTtsResult(r);
      setRealTtsState(r.status === "success" ? "success" : r.status);
      setAudioKey((k) => k + 1);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setRealTtsState("error");
      setRealTtsResult({ action: "realTtsCreate", status: "error", summary: "실제 목소리 생성 요청에 실패했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  const acceptRealTtsQuality = useCallback(async () => {
    if (!selectedTopicId || !realTtsApprovalReady) return;
    setRealTtsApprovalState("running");
    setRealTtsApprovalResult(null);
    try {
      const r = await postAction("realTtsQualityAccept", {
        topicId: selectedTopicId,
        confirmListenedAllParts: confirmTtsListenedAllParts,
        confirmVoiceQualityAccepted: confirmTtsVoiceQuality,
        confirmDownstreamUse: confirmTtsDownstreamUse,
        approvalText: confirmTtsApprovalText.trim(),
      });
      setRealTtsApprovalResult(r);
      setRealTtsApprovalState(
        r.status === "success" ? "success" : r.status,
      );
      await refreshRealMedia(selectedTopicId);
    } catch {
      setRealTtsApprovalState("error");
      setRealTtsApprovalResult({
        action: "realTtsQualityAccept",
        status: "error",
        summary: "음성 청취 승인을 기록하지 못했습니다.",
      });
    }
  }, [
    confirmTtsApprovalText,
    confirmTtsDownstreamUse,
    confirmTtsListenedAllParts,
    confirmTtsVoiceQuality,
    realTtsApprovalReady,
    refreshRealMedia,
    selectedTopicId,
  ]);

  // 장면 이미지 만들기 — 확정 대본의 흐름 기반 장면 수, 재클릭 시 모자란 장면만 이어서 생성한다.
  const runSceneImages = useCallback(async () => {
    if (!selectedTopicId || realImagesReviewable) return;
    setImagesState("running");
    setImagesResult(null);
    setImageReviewState("idle");
    setImageReviewResult(null);
    try {
      const r = await postAction("realSceneImagesCreate", { topicId: selectedTopicId });
      setImagesResult(r);
      setImagesState(r.status === "success" ? "success" : r.status);
      setSceneImageKey((key) => key + 1);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setImagesState("error");
      setImagesResult({ action: "realSceneImagesCreate", status: "error", summary: "장면 이미지 생성 요청에 실패했습니다." });
    }
  }, [realImagesReviewable, selectedTopicId, refreshRealMedia]);

  const acceptRealSceneImagesQuality = useCallback(async () => {
    if (!selectedTopicId || !imageReviewApprovalReady || !realMedia) return;
    setImageReviewState("running");
    setImageReviewResult(null);
    try {
      const r = await postAction("realSceneImagesReviewAccept", {
        topicId: selectedTopicId,
        claims: realMedia.parts.map((part) => ({
          partId: part.id,
          imageSetSha256: part.realImages.manualVisualReview.imageSetSha256,
        })),
        confirmReviewedAllImages: confirmImagesReviewedAll,
        confirmVisualQualityAccepted: confirmImageVisualQuality,
        confirmDownstreamUse: confirmImageDownstreamUse,
        approvalText: confirmImageApprovalText.trim(),
      });
      setImageReviewResult(r);
      setImageReviewState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setImageReviewState("error");
      setImageReviewResult({
        action: "realSceneImagesReviewAccept",
        status: "error",
        summary: "이미지 시각 승인을 기록하지 못했습니다.",
      });
    }
  }, [
    confirmImageApprovalText,
    confirmImageDownstreamUse,
    confirmImageVisualQuality,
    confirmImagesReviewedAll,
    imageReviewApprovalReady,
    realMedia,
    refreshRealMedia,
    selectedTopicId,
  ]);

  const regenerateSelectedSceneImages = useCallback(async () => {
    if (!selectedTopicId || !selectedImageRegenerationReady) return;
    setImagesState("running");
    setImagesResult(null);
    setImageReviewState("idle");
    setImageReviewResult(null);
    try {
      const r = await postAction("realSceneImagesRegenerateSelected", {
        topicId: selectedTopicId,
        selections: selectedImageScenes.map((scene) => ({
          partId: scene.partId,
          sceneIndex: scene.sceneIndex,
          imageSha256: scene.imageSha256,
          imageSetSha256: scene.imageSetSha256,
        })),
        confirmRegeneration: confirmSelectedRegeneration,
        approvalText: confirmSelectedRegenerationText.trim(),
      });
      setImagesResult(r);
      setImagesState(r.status === "success" ? "success" : r.status);
      setSceneImageKey((key) => key + 1);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setImagesState("error");
      setImagesResult({
        action: "realSceneImagesRegenerateSelected",
        status: "error",
        summary: "선택 장면 재생성 요청에 실패했습니다.",
      });
    }
  }, [
    confirmSelectedRegeneration,
    confirmSelectedRegenerationText,
    refreshRealMedia,
    selectedImageRegenerationReady,
    selectedImageScenes,
    selectedTopicId,
  ]);

  // Flow 모션 준비 — 로컬 패킷과 승인 대기 상태만 생성한다. 외부 브라우저/크레딧 작업은 하지 않는다.
  const runFlowMotionPrepare = useCallback(async () => {
    if (!selectedTopicId) return;
    setFlowMotionState("running");
    setFlowMotionResult(null);
    try {
      const r = await postAction("flowMotionPrepare", { topicId: selectedTopicId });
      const raw = r.raw as { flowMotion?: WizardFlowMotionStatus } | undefined;
      if (raw?.flowMotion) setFlowMotion(raw.flowMotion);
      setFlowMotionResult(r);
      setFlowMotionState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFlowMotionState("error");
      setFlowMotionResult({ action: "flowMotionPrepare", status: "error", summary: "Flow 모션 작업 패킷을 준비하지 못했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  const runFlowMotionGenerate = useCallback(async (jobId: string) => {
    if (!selectedTopicId) return;
    setFlowMotionState("running");
    setFlowMotionResult(null);
    try {
      const r = await postAction("flowMotionGenerate", {
        topicId: selectedTopicId,
        jobId,
        ownerApproval: flowMotionApprovalInputs[jobId] ?? "",
      });
      const raw = r.raw as { flowMotion?: WizardFlowMotionStatus } | undefined;
      if (raw?.flowMotion) setFlowMotion(raw.flowMotion);
      if (r.status === "success") setFlowMotionApprovalInputs((current) => ({ ...current, [jobId]: "" }));
      setFlowMotionResult(r);
      setFlowMotionState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFlowMotionState("error");
      setFlowMotionResult({ action: "flowMotionGenerate", status: "error", summary: "Flow 영상 생성 요청을 완료하지 못했습니다. 자동 재시도하지 않습니다." });
    }
  }, [selectedTopicId, flowMotionApprovalInputs, refreshRealMedia]);

  const runFlowMotionQaPass = useCallback(async (jobId: string) => {
    if (!selectedTopicId) return;
    setFlowMotionState("running");
    setFlowMotionResult(null);
    try {
      const r = await postAction("flowMotionQaPass", {
        topicId: selectedTopicId,
        jobId,
        checks: flowMotionQaChecks[jobId] ?? {},
      });
      const raw = r.raw as { flowMotion?: WizardFlowMotionStatus } | undefined;
      if (raw?.flowMotion) setFlowMotion(raw.flowMotion);
      setFlowMotionResult(r);
      setFlowMotionState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFlowMotionState("error");
      setFlowMotionResult({ action: "flowMotionQaPass", status: "error", summary: "Owner 모션 검수 결과를 저장하지 못했습니다." });
    }
  }, [selectedTopicId, flowMotionQaChecks, refreshRealMedia]);

  const runFlowMotionQaFail = useCallback(async (jobId: string) => {
    if (!selectedTopicId) return;
    setFlowMotionState("running");
    setFlowMotionResult(null);
    try {
      const r = await postAction("flowMotionQaFail", {
        topicId: selectedTopicId,
        jobId,
        note: flowMotionQaNotes[jobId] ?? "Owner visual QA failed",
      });
      const raw = r.raw as { flowMotion?: WizardFlowMotionStatus } | undefined;
      if (raw?.flowMotion) setFlowMotion(raw.flowMotion);
      setFlowMotionResult(r);
      setFlowMotionState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFlowMotionState("error");
      setFlowMotionResult({ action: "flowMotionQaFail", status: "error", summary: "Owner 모션 불합격 결과를 저장하지 못했습니다." });
    }
  }, [selectedTopicId, flowMotionQaNotes, refreshRealMedia]);

  // 최종 영상 만들기 — 실제 음성 + 흐름 기반 실제 이미지 + 자막 + 모션 합성.
  const runFinalVideo = useCallback(async () => {
    if (!selectedTopicId) return;
    setFinalVideoState("running");
    setFinalVideoResult(null);
    setFinalVideoReviewState("idle");
    setFinalVideoReviewResult(null);
    setConfirmFinalVideosWatched(false);
    setConfirmFinalPublishMetadataReviewed(false);
    setConfirmFinalExactFiles(false);
    setConfirmFinalVideoApprovalText("");
    setPreflightState("idle");
    setPreflightResult(null);
    setConfirmReviewed(false);
    setConfirmDiscoveryReady(false);
    setConfirmPublish(false);
    setConfirmText("");
    try {
      const r = await postAction("finalVideoCreate", { topicId: selectedTopicId });
      setFinalVideoResult(r);
      setFinalVideoState(r.status === "success" ? "success" : r.status);
      setPreviewKey((k) => k + 1);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFinalVideoState("error");
      setFinalVideoResult({ action: "finalVideoCreate", status: "error", summary: "최종 영상 합성 요청에 실패했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  const acceptFinalVideoReview = useCallback(async () => {
    if (!selectedTopicId) return;
    setFinalVideoReviewState("running");
    setFinalVideoReviewResult(null);
    try {
      const expectedParts = (realMedia?.parts ?? [])
        .map((part) => ({
          partId: part.id,
          finalMp4Sha256:
            part.finalVideo.finalMp4Sha256 ?? "",
          publishMetadataSha256:
            part.finalVideo.publishMetadataSha256 ?? "",
        }))
        .sort((left, right) =>
          left.partId.localeCompare(right.partId),
        );
      const r = await postAction("finalVideoReviewAccept", {
        topicId: selectedTopicId,
        confirmWatchedAllParts: confirmFinalVideosWatched,
        confirmPublishMetadataReviewed:
          confirmFinalPublishMetadataReviewed,
        confirmExactFilesForPublish: confirmFinalExactFiles,
        approvalText: confirmFinalVideoApprovalText.trim(),
        expectedParts,
      });
      setFinalVideoReviewResult(r);
      setFinalVideoReviewState(
        r.status === "success" ? "success" : r.status,
      );
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFinalVideoReviewState("error");
      setFinalVideoReviewResult({
        action: "finalVideoReviewAccept",
        status: "error",
        summary: "최종 영상 Owner 승인을 기록하지 못했습니다.",
      });
    }
  }, [
    confirmFinalExactFiles,
    confirmFinalPublishMetadataReviewed,
    confirmFinalVideoApprovalText,
    confirmFinalVideosWatched,
    realMedia?.parts,
    refreshRealMedia,
    selectedTopicId,
  ]);

  const runVoiceSample = useCallback(async () => {
    if (!selectedTopicId) return;
    setVoiceState("running");
    setVoiceResult(null);
    try {
      const r = await postAction("voiceSample", { topicId: selectedTopicId });
      setVoiceResult(r);
      setVoiceState(r.status === "success" ? "success" : r.status);
    } catch {
      setVoiceState("error");
      setVoiceResult({ action: "voiceSample", status: "error", summary: "음성 시안 요청에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runVideoCreate = useCallback(async () => {
    if (!selectedTopicId) return;
    setVideoState("running");
    setVideoResult(null);
    try {
      const r = await postAction("videoCreate", { topicId: selectedTopicId });
      setVideoResult(r);
      setVideoState(r.status === "success" ? "success" : r.status);
    } catch {
      setVideoState("error");
      setVideoResult({ action: "videoCreate", status: "error", summary: "영상 만들기 요청에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runPreviewStatus = useCallback(async () => {
    if (!selectedTopicId) return;
    setPreviewState("running");
    setPreviewResult(null);
    try {
      const r = await postAction("previewStatus", { topicId: selectedTopicId });
      setPreviewResult(r);
      setPreviewState(r.status === "success" ? "success" : r.status);
      const raw = r.raw as { video?: WizardVideo } | undefined;
      if (r.status === "success" && raw?.video) {
        setPreviewVideo(raw.video);
        setPreviewKey((k) => k + 1);
      } else {
        setPreviewVideo(null);
      }
    } catch {
      setPreviewState("error");
      setPreviewResult({ action: "previewStatus", status: "error", summary: "미리보기 확인에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runPreflight = useCallback(async () => {
    if (!selectedTopicId) return;
    setPreflightState("running");
    setPreflightResult(null);
    try {
      const r = await postAction("wizardPreflight", { topicId: selectedTopicId });
      setPreflightResult(r);
      setPreflightState(r.status === "success" ? "success" : r.status);
    } catch {
      setPreflightState("error");
      setPreflightResult({ action: "wizardPreflight", status: "error", summary: "게시 전 점검 요청에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runActualUpload = useCallback(async () => {
    if (!selectedTopicId) return;
    setUploadState("running");
    setUploadResult(null);
    try {
      const r = await postAction("actualUpload", {
        topicId: selectedTopicId,
        confirmReviewed,
        confirmDiscoveryReady,
        confirmPublish,
        confirmText: confirmText.trim(),
        expectedFinalVideoApprovalFingerprint:
          realMedia?.finalVideo.ownerApprovalFingerprint,
      });
      setUploadResult(r);
      setUploadState(r.status === "success" ? "success" : r.status);
    } catch {
      setUploadState("error");
      setUploadResult({ action: "actualUpload", status: "error", summary: "업로드 요청에 실패했습니다." });
    } finally {
      // 성공/부분 실패/timeout/클라이언트 응답 유실 모두 최신 result+ledger 증거를 다시 읽는다.
      // 다음 클릭은 새 needs_attention/manual_recovery 상태가 즉시 막는다.
      await Promise.all([
        refreshUploadReadyList(),
        refreshAutomationPlan(selectedTopicId),
      ]);
    }
  }, [
    selectedTopicId,
    confirmReviewed,
    confirmDiscoveryReady,
    confirmPublish,
    confirmText,
    realMedia?.finalVideo.ownerApprovalFingerprint,
    refreshAutomationPlan,
    refreshUploadReadyList,
  ]);

  // ── 렌더 ─────────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white shadow-sm px-6 py-6">
      <div className="mb-1.5 flex items-center gap-2.5 flex-wrap">
        <h2 className="text-2xl font-bold text-slate-900">자동 쇼츠 만들기</h2>
        <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold">
          확인 전에는 업로드 없음
        </span>
      </div>
      <p className="text-[15px] text-slate-600 mb-5 leading-relaxed">
        여기가 새 쇼츠 만들기 시작점입니다. 1번부터 순서대로 누르면 대본 → 실제 목소리 → 장면 이미지 → 최종 영상까지
        만들어지고, 마지막 단계에서 확인 절차를 거쳐야만 실제 업로드가 실행됩니다. 테스트 소리·시안 영상은 업로드할 수
        없습니다.
      </p>

      {localDev === false ? (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-[15px] text-amber-800 font-semibold">
            실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다.
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            이 배포 화면에서는 흐름 확인만 가능합니다. Owner PC에서 pnpm dev로 연 뒤 같은 주소를 열어 주세요.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {localDev === true ? (
          <details
            data-testid="wizard-advanced-operations-toggle"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            onToggle={(event) => setShowAdvancedOperations(event.currentTarget.open)}
          >
            <summary className="cursor-pointer text-sm font-bold text-slate-700">
              기존 작업 이어보기 · 고급 운영 도구
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              새 쇼츠 제작에는 아래 카테고리 선택부터 시작하면 됩니다. 이 영역은 이미 만든 영상의 게시 준비, 중단된 로컬 작업 확인, 여러 주제의 작업 순서를 다룰 때만 엽니다.
            </p>
          </details>
        ) : null}

        {localDev === true && showAdvancedOperations ? (
          <section data-testid="wizard-safe-session" className="rounded-2xl border-2 border-violet-200 bg-violet-50/60 px-5 py-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">Owner 시작 안전 세션</h3>
                  <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-bold text-violet-700">Owner 클릭 · 로컬 최대 3회</span>
                  <StateBadge state={safeSessionState} />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  최대 1~3회 상한 안에서 Owner가 단일 실행 또는 유한 연속 실행을 선택합니다. 자동 재시도·유료 생성·QA 판정·업로드·게시는 연결되지 않았습니다.
                </p>
              </div>
              <button
                type="button"
                data-testid="wizard-action-safe-session-refresh"
                className="rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-40"
                disabled={safeSessionState === "running"}
                onClick={() => void refreshSafeSession()}
              >
                세션 상태 다시 확인
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-violet-200 bg-white px-4 py-3">
              {safeSession?.currentSession ? (
                <div className="space-y-2">
                  <p className="text-[15px] font-bold text-slate-900">
                    {safeSession.currentSession.actionInFlight
                      ? "중단 claim 확인 필요"
                      : safeSession.currentSession.status === "ready"
                        ? "준비됨"
                        : "중지 요청됨"} · 최대 {safeSession.currentSession.maxActionCount}회 · 완료 {safeSession.currentSession.completedActionCount}회
                  </p>
                  <p className="text-sm text-slate-600">
                    세션 ID: <span className="font-mono text-xs">{safeSession.currentSession.sessionId}</span> · 시작 {safeSession.currentSession.startedAt.replace("T", " ")}
                  </p>
                  {safeSession.currentSession.activeClaim ? (
                    <div data-testid="wizard-safe-session-active-claim" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-sm font-bold text-amber-900">
                        중단된 작업: {safeSession.currentSession.activeClaim.topicId} · {safeSession.currentSession.activeClaim.action}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700">
                        claim <span className="font-mono">{safeSession.currentSession.activeClaim.claimFingerprint.slice(0, 12)}</span> · 자동 재시도 없음
                      </p>
                    </div>
                  ) : null}
                  {safeSessionCoordinator ? (
                    <div
                      data-testid="wizard-safe-session-coordinator"
                      className={`rounded-lg border px-3 py-3 ${
                        safeSessionCoordinator.state === "ready"
                          ? "border-violet-300 bg-violet-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">
                        {safeSessionCoordinator.state === "ready"
                          ? "다음 로컬 안전 작업 1개 준비됨"
                          : "현재 세션 결정"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {safeSessionCoordinator.reason}
                      </p>
                      {safeSessionCoordinator.state === "ready" &&
                      safeSessionCoordinator.nextClaim ? (
                        <>
                          <p
                            data-testid="wizard-safe-session-next-action"
                            className="mt-2 text-sm font-semibold text-violet-900"
                          >
                            {safeSessionCoordinator.nextClaim.topicId} · {safeSessionCoordinator.nextClaim.action}
                          </p>
                          <button
                            type="button"
                            data-testid="wizard-action-safe-session-run-next"
                            className="mt-3 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-40"
                            disabled={
                              safeSessionState === "running" ||
                              safeSession.currentSession.actionInFlight ||
                              safeSessionRecovery?.state !== "inactive"
                            }
                            onClick={() => void runSafeSessionNext()}
                          >
                            다음 안전 작업 1회 실행
                          </button>
                          <button
                            type="button"
                            data-testid="wizard-action-safe-session-run-bounded"
                            className="ml-2 mt-3 rounded-xl border border-violet-700 bg-white px-4 py-2 text-sm font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-40"
                            disabled={
                              safeSessionState === "running" ||
                              safeSession.currentSession.status !== "ready" ||
                              safeSession.currentSession.actionInFlight ||
                              safeSession.currentSession.completedActionCount >= safeSession.currentSession.maxActionCount ||
                              safeSessionRecovery?.state !== "inactive"
                            }
                            onClick={() => void runSafeSessionBounded()}
                          >
                            남은 로컬 작업 최대 3회 실행
                          </button>
                          <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            단일 실행은 현재 작업 1개 뒤 멈춥니다. 최대 3회 실행은 매 회차 지문을 다시 확인하고 첫 실패·Owner 확인 단계·상한에서 멈춥니다. 자동 재시도·유료 생성·QA 판정·업로드·게시는 실행하지 않습니다.
                          </p>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {safeSession.currentSession.stopRequestedAt ? (
                    <p className="text-sm font-semibold text-amber-700">중지 요청: {safeSession.currentSession.stopRequestedAt.replace("T", " ")}</p>
                  ) : null}
                  {safeSessionClose ? (
                    <div
                      data-testid="wizard-safe-session-close"
                      className={`rounded-lg border px-3 py-3 ${
                        safeSessionClose.eligible
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">
                        {safeSessionClose.eligible ? "세션 보관 종료 가능" : "세션 보관 종료 대기"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{safeSessionClose.reason}</p>
                      {safeSessionClose.eligible ? (
                        <>
                          <button
                            type="button"
                            data-testid="wizard-action-safe-session-close"
                            className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-40"
                            disabled={safeSessionState === "running"}
                            onClick={() => void closeSafeSession()}
                          >
                            세션 보관 종료
                          </button>
                          <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            종료 요약만 이력에 남기고 현재 세션을 비웁니다. 작업 실행·재시도·유료 생성·업로드는 실행하지 않습니다.
                          </p>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      data-testid="wizard-action-safe-session-stop"
                      className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-40"
                      disabled={safeSessionState === "running" || safeSession.currentSession.status === "stop_requested"}
                      onClick={() => void stopSafeSession()}
                    >
                      {safeSession.currentSession.status === "stop_requested" ? "중지 요청 기록됨" : "중지 요청 기록"}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">세션은 자동으로 닫히지 않습니다. 중지 요청 또는 상한 도달 뒤 Owner가 별도 보관 종료를 확인해야만 새 세션을 시작할 수 있습니다.</p>
                </div>
              ) : (
                <div className="flex items-end gap-3 flex-wrap">
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    실행 상한
                    <select
                      data-testid="wizard-safe-session-cap"
                      value={safeSessionCap}
                      onChange={(event) => setSafeSessionCap(Number(event.target.value) as 1 | 2 | 3)}
                      className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
                      disabled={safeSessionState === "running"}
                    >
                      <option value={1}>1회</option>
                      <option value={2}>2회</option>
                      <option value={3}>3회</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    data-testid="wizard-action-safe-session-start"
                    className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-40"
                    disabled={safeSessionState === "running"}
                    onClick={() => void startSafeSession()}
                  >
                    안전 세션 시작 의도 기록
                  </button>
                  <p className="max-w-xl text-xs leading-relaxed text-slate-500">이 버튼은 작업을 시작하지 않고, 다음 별도 실행기 단계가 읽을 로컬 의도만 기록합니다.</p>
                </div>
              )}
            </div>
            {safeSessionRecovery && safeSessionRecovery.state !== "inactive" ? (
              <div
                data-testid="wizard-safe-session-recovery"
                className={`mt-3 rounded-xl border px-4 py-3 ${
                  safeSessionRecovery.state === "decision_required"
                    ? "border-amber-300 bg-amber-50"
                    : "border-rose-300 bg-rose-50"
                }`}
              >
                <p className="text-sm font-bold text-slate-900">
                  {safeSessionRecovery.state === "decision_required"
                    ? "Owner 복구 확인 필요"
                    : "자동 판정 불가 · claim 잠금 유지"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{safeSessionRecovery.reason}</p>
                <p className="mt-1 text-xs text-slate-500">
                  판정 {safeSessionRecovery.comparison} · 복구 지문{" "}
                  <span className="font-mono">{safeSessionRecovery.recoveryFingerprint.slice(0, 12)}</span>
                </p>
                {safeSessionRecovery.state === "decision_required" &&
                safeSessionRecovery.executionRecoveryDecision != null ? (
                  <div
                    data-testid="wizard-safe-session-recovery-chain-required"
                    className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-amber-900">
                      먼저 아래 자동 진행 안전장치의 실행 영수증 복구를 완료하세요.
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      이 카드에서는 두 복구를 이어서 실행하지 않으며 안전 세션 claim도 변경하지 않습니다.
                    </p>
                  </div>
                ) : null}
                {safeSessionRecovery.state === "decision_required" &&
                isSafeSessionDirectRecoveryDecision(safeSessionRecovery.allowedDecision) ? (
                  <button
                    type="button"
                    data-testid="wizard-action-safe-session-recovery-resolve"
                    className="mt-3 rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-40"
                    disabled={safeSessionState === "running"}
                    onClick={() => void resolveSafeSessionRecovery(
                      safeSessionRecovery.allowedDecision as WizardSafeSessionDirectRecoveryDecision,
                    )}
                  >
                    {safeSessionRecovery.allowedDecision === "terminalize_session_from_receipt"
                      ? "일치 영수증으로 세션 1회 종결"
                      : "claim 해제 후 세션 중지"}
                  </button>
                ) : null}
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  이 복구는 작업·영수증·재시도·유료 생성·렌더·업로드·게시를 실행하지 않습니다.
                </p>
              </div>
            ) : null}
            <ResultNote result={safeSessionResult} />
          </section>
        ) : null}

        {localDev === true && showAdvancedOperations ? (
          <section data-testid="wizard-automation-queue" className="rounded-2xl border-2 border-sky-200 bg-sky-50/60 px-5 py-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">자동 작업 큐</h3>
                  <span className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-bold text-sky-700">계획 모드</span>
                  <StateBadge state={automationQueueState} />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  주제와 현재 단계를 로컬에 보존합니다. 자동 타이머는 없으며, 버튼을 누를 때도 안전한 로컬 작업을 최대 1개만 실행합니다.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  data-testid="wizard-action-automation-queue-enqueue"
                  className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-800 disabled:opacity-40"
                  disabled={!selectedTopicId || !automationPlan || automationQueueState === "running" || automationQueueBusyTopicId != null}
                  onClick={() => void enqueueCurrentAutomationTopic()}
                >
                  선택 주제 큐에 저장
                </button>
                <button
                  type="button"
                  data-testid="wizard-action-automation-queue-refresh"
                  className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-40"
                  disabled={automationQueueState === "running" || automationQueueBusyTopicId != null}
                  onClick={() => void refreshAutomationQueue()}
                >
                  큐 다시 확인
                </button>
              </div>
            </div>
            {automationQueue ? (
              <div data-testid="wizard-automation-queue-dry-run" className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-bold text-indigo-950">다음 큐 실행 미리보기</p>
                  <span className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700">
                    미리보기 · 자동 실행 없음
                  </span>
                </div>
                {automationQueue.runPreview.selected ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-bold text-slate-900">
                      우선순위 {automationQueue.runPreview.selected.queueOrder} · {automationQueue.runPreview.selected.title} · {automationQueue.runPreview.selected.stageLabel}
                    </p>
                    <p className="text-sm text-indigo-800">
                      정확한 다음 액션: <code className="rounded bg-white px-1.5 py-0.5 font-bold">{automationQueue.runPreview.selected.action}</code>
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600">{automationQueue.runPreview.selected.reason}</p>
                    <button
                      type="button"
                      data-testid="wizard-action-automation-queue-run-selected"
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40"
                      disabled={
                        !automationQueue.runPreview.previewFingerprint ||
                        automationQueueBusyTopicId != null ||
                        automationQueueState === "running"
                      }
                      onClick={() => void runSelectedQueueAdvance()}
                    >
                      {automationQueueBusyTopicId === automationQueue.runPreview.selected.topicId
                        ? "선택된 안전 작업 실행 중…"
                        : "선택된 안전 작업 1개 실행"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    현재 큐에는 실행 가능한 로컬 안전 작업이 없습니다. 아래 주제별 건너뜀 사유를 확인해 주세요.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {automationQueue.runPreview.evaluatedJobCount}개 평가 · {automationQueue.runPreview.eligibleJobCount}개 실행 가능 · 영수증 생성 0회
                </p>
              </div>
            ) : null}
            {automationQueue ? (
              <div data-testid="wizard-automation-queue-batch-policy" className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-bold text-violet-950">큐 전체 다음 단계</p>
                  <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-bold text-violet-700">계획 전용 · 실행 없음</span>
                </div>
                <p className="mt-1 text-xs text-violet-800">
                  {automationQueue.batchPolicy.itemCount}개 항목 · 로컬 안전 작업 {automationQueue.batchPolicy.localSafeItemCount}개 · Owner 중단/확인 {automationQueue.batchPolicy.ownerStopItemCount}개
                </p>
                {automationQueue.batchPolicy.entries.length ? (
                  <div className="mt-3 space-y-2">
                    {automationQueue.batchPolicy.entries.map((item) => (
                      <div key={item.jobId ?? item.topicId ?? item.title ?? item.label} className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <p className="text-sm font-bold text-slate-900">
                          우선순위 {item.queueOrder ?? "-"} · {item.title ?? item.topicId ?? "식별 불가 항목"} · {item.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.detail}</p>
                        <p className="mt-1 text-xs text-violet-700">
                          다음 단계: {item.stageLabel ?? "없음"}{item.action ? ` · ${item.action}` : ""}{item.gate ? ` · ${item.gate}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">큐에 저장된 항목이 없어 정책 미리보기도 비어 있습니다.</p>
                )}
              </div>
            ) : null}
            {automationQueue ? (
              <div data-testid="wizard-automation-queue-capacity-summary" className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-bold text-teal-950">큐 준비도 요약</p>
                  <span className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-xs font-bold text-teal-700">집계 전용 · 실행 없음</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-teal-900">큐의 다음 상태를 집계한 정보입니다. 순서 변경·실행·승인 요청을 하지 않습니다.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <p className="rounded-lg border border-teal-100 bg-white px-3 py-2"><b>로컬 안전 가능</b> {automationQueue.capacitySummary.localSafeReadyCount}개 · 대기 {automationQueue.capacitySummary.localSafeWaitingCount}개</p>
                  <p className="rounded-lg border border-teal-100 bg-white px-3 py-2"><b>유료 생성 승인</b> {automationQueue.capacitySummary.paidGenerationApprovalCount}개 · QA {automationQueue.capacitySummary.ownerQualityCheckCount}개</p>
                  <p className="rounded-lg border border-teal-100 bg-white px-3 py-2"><b>게시 확인</b> {automationQueue.capacitySummary.publicationApprovalCount}개 · 기타 Owner 결정 {automationQueue.capacitySummary.ownerDecisionCount}개</p>
                  <p className="rounded-lg border border-teal-100 bg-white px-3 py-2"><b>일시정지</b> {automationQueue.capacitySummary.pausedCount}개 · 복구/안전장치 {automationQueue.capacitySummary.recoveryOrBlockedCount}개</p>
                  <p className="rounded-lg border border-teal-100 bg-white px-3 py-2"><b>완료</b> {automationQueue.capacitySummary.completedCount}개 · 전체 {automationQueue.capacitySummary.queueItemCount}개</p>
                </div>
              </div>
            ) : null}
            {automationQueue ? (
              <div data-testid="wizard-unattended-policy-preview" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-bold text-amber-950">자동화 정책 상태</p>
                  <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-800">
                    로컬 제한 모드 · Owner 시작
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-amber-950">{automationQueue.unattendedPolicy.reason}</p>
                <p className="mt-1 text-xs text-amber-800">
                  현재 모드: Owner 시작 로컬 최대 3회 · 정책 지문{" "}
                  <span className="font-mono">{automationQueue.unattendedPolicy.policyFingerprint.slice(0, 12)}</span>
                </p>
                <div className="mt-3 grid gap-2 lg:grid-cols-3">
                  {automationQueue.unattendedPolicy.options.map((option) => (
                    <article
                      key={option.profileId}
                      data-testid="wizard-unattended-policy-option"
                      className={`rounded-lg border bg-white px-3 py-3 ${
                        option.recommended ? "border-emerald-300" : "border-amber-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{option.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          option.riskLevel === "low"
                            ? "bg-emerald-100 text-emerald-800"
                            : option.riskLevel === "high"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}>
                          {option.availability === "available_owner_started"
                            ? "사용 가능"
                            : option.riskLevel === "critical"
                              ? "최고 위험 · 비활성"
                              : "고위험 · 비활성"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{option.description}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-700">
                        유료 TTS {option.paidTtsAllowed ? "허용 후보" : "차단"} · 이미지 {option.imageGenerationAllowed ? "허용 후보" : "차단"} · Flow {option.flowGenerationAllowed ? "허용 후보" : "차단"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        QA 자동판정 {option.ownerQaDecisionAllowed ? "허용 후보" : "차단"} · 실제 게시 {option.publicationAllowed ? "허용 후보" : "차단"} · 자동 재시도 {option.automaticRetryLimit}회
                      </p>
                    </article>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-amber-100 bg-white px-3 py-2">
                  <p className="text-sm font-bold text-slate-900">활성화 전에 Owner가 정할 항목</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs leading-relaxed text-slate-600">
                    {automationQueue.unattendedPolicy.requiredOwnerDecisionsBeforeActivation.map((decision) => (
                      <li key={decision}>{decision}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-amber-800">
                  이 카드는 상태만 보여줍니다. 로컬 최대 3회 실행은 위 안전 세션에서 Owner가 직접 시작하며, 타이머·백그라운드 작업·자동 재시도·유료 생성·QA 판정·업로드·게시는 모두 비활성입니다.
                </p>
              </div>
            ) : null}
            {automationQueue ? (
              <div data-testid="wizard-external-generation-budget-policy" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-bold text-rose-950">유료·외부 생성 상한 후보</p>
                  <span className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-800">
                    활성화 차단 · 일/월 상한 미설정
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-rose-950">
                  {automationQueue.externalGenerationBudgetPolicy.reason}
                </p>
                <p className="mt-1 text-xs text-rose-800">
                  현재: 매 제출 Owner 승인 · 추천 후보: 주제별 상한형 · 정책 지문{" "}
                  <span className="font-mono">
                    {automationQueue.externalGenerationBudgetPolicy.policyFingerprint.slice(0, 12)}
                  </span>
                </p>
                <div className="mt-3 grid gap-2 lg:grid-cols-3">
                  {automationQueue.externalGenerationBudgetPolicy.providerBudgets.map((provider) => (
                    <article
                      key={provider.providerId}
                      data-testid="wizard-external-generation-provider-budget"
                      className="rounded-lg border border-rose-100 bg-white px-3 py-3"
                    >
                      <p className="text-sm font-bold text-slate-900">{provider.label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        주제당 최대 {provider.proposedPerTopicSubmissionCap}회
                        {provider.proposedPerTopicCreditCap != null
                          ? ` · 최대 ${provider.proposedPerTopicCreditCap}크레딧`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        일일 상한 미설정 · 월간 상한 미설정 · 동시 1개 · 자동 재시도 0회
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-rose-700">
                        사람 검수 필수 · 계정 fallback 비활성
                      </p>
                    </article>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  <div className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                    <p className="text-sm font-bold text-slate-900">무조건 중단하는 경우</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs leading-relaxed text-slate-600">
                      <li>로그인·세션·UI 준비 실패 또는 제출 전 한도 소진</li>
                      <li>제출 후 timeout·전송 여부 불명·결과 식별 실패</li>
                      <li>provider 오류·다운로드 연결 실패·사람 QA 대기/실패</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                    <p className="text-sm font-bold text-slate-900">Owner 결정이 남은 항목</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs leading-relaxed text-slate-600">
                      {automationQueue.externalGenerationBudgetPolicy.missingOwnerDecisions.map((decision) => (
                        <li key={decision}>{decision}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-rose-800">
                  이 카드는 예산을 예약하거나 생성 요청을 보내지 않습니다. 한도가 모두 확정되기 전에는 유료 TTS·이미지·Flow 자동 생성과 Gemini 3·4 fallback을 사용할 수 없습니다.
                </p>
              </div>
            ) : null}
            {automationQueue?.jobs.length ? (
              <div className="mt-4 space-y-2.5">
                {automationQueue.jobs.slice().sort((left, right) => left.queueOrder - right.queueOrder).map((job, jobIndex, orderedJobs) => {
                  const isPaused = job.lifecycle?.status === "paused";
                  const isComplete = job.livePlan.status === "complete";
                  const canAdvance = !isPaused && job.livePlan.next?.canAutoAdvance === true && job.executionGuard.status === "available";
                  const runEvaluation = automationQueue.runPreview.evaluations.find((item) => item.jobId === job.jobId);
                  return (
                    <article key={job.jobId} data-testid="wizard-automation-queue-job" className="rounded-xl border border-sky-200 bg-white px-4 py-3">
                      <div className="min-w-0">
                          <p className="font-bold text-slate-900">{job.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500 break-all">{job.topicId}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            우선순위 {job.queueOrder} · {job.livePlan.completedStageCount}/{job.livePlan.totalStageCount} 단계 · {job.livePlan.next?.stageLabel ?? "완료"}
                          </p>
                          <p className={`mt-0.5 text-sm font-bold ${canAdvance ? "text-emerald-700" : "text-amber-700"}`}>
                            {isPaused
                              ? "Owner가 일시정지함"
                              : canAdvance
                              ? "Owner 클릭 시 안전 작업 1개 실행 가능"
                              : AUTOMATION_GATE_LABEL[job.livePlan.next?.gate ?? ""] ?? "현재 단계 확인 필요"}
                          </p>
                          {runEvaluation ? (
                            <p data-testid="wizard-automation-queue-job-decision" className={`mt-1 text-xs font-semibold ${runEvaluation.selected ? "text-indigo-700" : "text-slate-500"}`}>
                              {runEvaluation.selected
                                ? `큐 미리보기 선택 · ${runEvaluation.action}`
                                : runEvaluation.eligible
                                  ? `후순위 대기 · ${runEvaluation.decisionReason}`
                                  : `건너뜀 · ${runEvaluation.decisionReason}`}
                            </p>
                          ) : null}
                          {job.lastAdvance ? (
                            <p className="mt-1 text-xs text-slate-500">
                              마지막 큐 실행: {job.lastAdvance.executedAction ?? "실행 없음"} · {job.lastAdvance.actionCount}개 · 자동 재시도 0회
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-slate-500">
                            실행 영수증: {job.executionGuard.status}
                            {job.executionGuard.receipt?.resultStatus ? ` · ${job.executionGuard.receipt.resultStatus}` : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              data-testid="wizard-action-automation-queue-priority-earlier"
                              className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-50 disabled:opacity-40"
                              disabled={jobIndex === 0 || automationQueueBusyTopicId != null || automationQueueState === "running"}
                              onClick={() => void moveAutomationQueuePriority(job, "earlier")}
                            >
                              앞으로
                            </button>
                            <button
                              type="button"
                              data-testid="wizard-action-automation-queue-priority-later"
                              className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-50 disabled:opacity-40"
                              disabled={jobIndex === orderedJobs.length - 1 || automationQueueBusyTopicId != null || automationQueueState === "running"}
                              onClick={() => void moveAutomationQueuePriority(job, "later")}
                            >
                              뒤로
                            </button>
                            <button
                              type="button"
                              data-testid="wizard-action-automation-queue-pause-toggle"
                              className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-40"
                              disabled={automationQueueBusyTopicId != null || automationQueueState === "running" || isComplete}
                              onClick={() => void updateAutomationQueueLifecycle(isPaused ? "automationQueueResume" : "automationQueuePause", job)}
                            >
                              {automationQueueBusyTopicId === job.topicId ? "처리 중…" : isPaused ? "큐 재개" : "큐 일시정지"}
                            </button>
                            {isComplete ? (
                              <button
                                type="button"
                                data-testid="wizard-action-automation-queue-archive"
                                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-40"
                                disabled={automationQueueBusyTopicId != null || automationQueueState === "running"}
                                onClick={() => void updateAutomationQueueLifecycle("automationQueueArchiveCompleted", job)}
                              >
                                완료 작업 보관
                              </button>
                            ) : null}
                            <button
                              type="button"
                              data-testid="wizard-action-automation-queue-remove"
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                              disabled={automationQueueBusyTopicId != null || automationQueueState === "running"}
                              onClick={() => void updateAutomationQueueLifecycle("automationQueueRemove", job)}
                            >
                              큐에서 제거
                            </button>
                          </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : automationQueueState !== "running" ? (
              <p className="mt-4 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-600">
                큐가 비어 있습니다. 주제를 선택한 뒤 현재 단계를 큐에 저장할 수 있습니다.
              </p>
            ) : null}
            {automationQueue?.history.length ? (
              <div data-testid="wizard-automation-queue-history" className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="font-bold text-slate-900">최근 큐 이력</p>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  {automationQueue.history.slice(-8).reverse().map((item) => (
                    <p key={`${item.at}-${item.kind}-${item.jobId}`}>
                      {item.at} · {item.title} · {item.kind}
                      {item.action ? ` · ${item.action}` : ""}
                      {item.status ? ` · ${item.status}` : ""}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            {automationQueue?.archivedJobs.length ? (
              <div data-testid="wizard-automation-queue-archive" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="font-bold text-emerald-950">완료 보관 이력</p>
                <div className="mt-2 space-y-1 text-xs text-emerald-900">
                  {automationQueue.archivedJobs.slice(-5).reverse().map((job) => (
                    <p key={`${job.jobId}-${job.archivedAt}`}>
                      {job.title} · {job.archivedPlan.completedStageCount}/{job.archivedPlan.totalStageCount} 단계 완료 · 최근 영수증 {job.executionGuard.status ?? "없음"}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <ResultNote result={automationQueueResult} />
          </section>
        ) : null}

        {localDev === true && showAdvancedOperations && selectedTopicId ? (
          <section data-testid="wizard-automation-plan" className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 px-5 py-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">자동 진행 상태</h3>
                  <StateBadge state={automationPlanState} />
                  {automationPlan ? (
                    <span className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700">
                      {automationPlan.completedStageCount}/{automationPlan.totalStageCount} 단계 준비
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  로컬 산출물을 다시 읽어 다음 작업을 자동으로 결정합니다. 유료 생성·Owner 검수·실제 게시 앞에서는 반드시 멈춥니다.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  data-testid="wizard-action-automation-advance"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    automationPlan?.next?.canAutoAdvance !== true ||
                    (automationExecutionGuard != null && automationExecutionGuard.status !== "available") ||
                    automationPlanState === "running" ||
                    automationAdvanceState === "running" ||
                    automationRecoveryState === "running"
                  }
                  onClick={() => void runAutomationAdvance()}
                >
                  {automationAdvanceState === "running" ? "안전 작업 1개 실행 중…" : "다음 안전 작업 1개 실행"}
                </button>
                <button
                  type="button"
                  data-testid="wizard-action-automation-plan"
                  className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-40"
                  disabled={automationPlanState === "running" || automationAdvanceState === "running" || automationRecoveryState === "running"}
                  onClick={() => void refreshAutomationPlan(selectedTopicId)}
                >
                  진행 상태 다시 확인
                </button>
              </div>
            </div>
            {automationPlan ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {automationPlan.stages.map((stage) => (
                    <span
                      key={stage.id}
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        stage.state === "ready"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : stage.state === "current"
                            ? "border-indigo-300 bg-white text-indigo-700"
                            : "border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      {stage.state === "ready" ? "✓ " : stage.state === "current" ? "→ " : ""}{stage.label}
                    </span>
                  ))}
                </div>
                {automationPlan.next ? (
                  <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3">
                    <p className="text-[15px] font-bold text-slate-900">다음 작업: {automationPlan.next.stageLabel}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{automationPlan.next.reason}</p>
                    <p className={`mt-1.5 text-sm font-bold ${automationPlan.next.canAutoAdvance ? "text-emerald-700" : "text-amber-700"}`}>
                      {AUTOMATION_GATE_LABEL[automationPlan.next.gate] ?? "확인 후 진행"}
                    </p>
                    {automationExecutionGuard ? (
                      <p className={`mt-1 text-xs font-semibold ${automationExecutionGuard.status === "available" || automationExecutionGuard.status === "not_applicable" ? "text-slate-500" : "text-amber-700"}`}>
                        실행 안전장치: {AUTOMATION_EXECUTION_GUARD_LABEL[automationExecutionGuard.status]}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[15px] font-bold text-emerald-700">
                    이 주제의 제작·게시 단계가 모두 완료됐습니다.
                  </p>
                )}
                {automationExecutionGuard?.recovery?.status !== "none" && automationExecutionGuard?.recovery ? (
                  <div data-testid="wizard-automation-recovery" className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-bold text-amber-900">중단 실행 증거 확인</p>
                      <StateBadge state={automationRecoveryState} />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                      {automationExecutionGuard.recovery.comparison === "current_plan_unchanged"
                        ? "중단 전과 현재 단계가 같습니다. 원래 작업은 실행하지 않은 채 잠금을 해제하면, 이후 별도 클릭으로 다시 시도할 수 있습니다."
                        : automationExecutionGuard.recovery.comparison === "artifacts_advanced"
                          ? "현재 산출물 단계가 중단 전보다 전진했습니다. 원래 작업을 다시 실행하지 않고 전진 사실만 확인 기록할 수 있습니다."
                          : "영수증·잠금·현재 산출물의 관계가 명확하지 않아 자동 복구 결정을 막았습니다."}
                    </p>
                    <dl className="mt-3 grid gap-1 text-xs text-amber-900 sm:grid-cols-2">
                      <div><dt className="inline font-bold">작업: </dt><dd className="inline">{automationExecutionGuard.recovery.receipt?.action ?? "확인 불가"}</dd></div>
                      <div><dt className="inline font-bold">시작: </dt><dd className="inline">{automationExecutionGuard.recovery.receipt?.startedAt?.replace("T", " ") ?? "확인 불가"}</dd></div>
                      <div><dt className="inline font-bold">중단 전 준비 단계: </dt><dd className="inline">{automationExecutionGuard.recovery.beforeCompletedStageCount ?? "확인 불가"}</dd></div>
                      <div><dt className="inline font-bold">현재 준비 단계: </dt><dd className="inline">{automationExecutionGuard.recovery.currentCompletedStageCount ?? "확인 불가"}</dd></div>
                    </dl>
                    {automationExecutionGuard.recovery.allowedDecision === "acknowledge_artifacts_advanced" ? (
                      <button
                        type="button"
                        data-testid="wizard-action-automation-recovery-acknowledge"
                        className="mt-3 rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-40"
                        disabled={automationRecoveryState === "running" || automationAdvanceState === "running"}
                        onClick={() => void resolveAutomationRecovery("acknowledge_artifacts_advanced")}
                      >
                        산출물 전진 확인 · 재실행 없이 잠금 해제
                      </button>
                    ) : automationExecutionGuard.recovery.allowedDecision === "clear_for_manual_retry" ? (
                      <button
                        type="button"
                        data-testid="wizard-action-automation-recovery-retry"
                        className="mt-3 rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-40"
                        disabled={automationRecoveryState === "running" || automationAdvanceState === "running"}
                        onClick={() => void resolveAutomationRecovery("clear_for_manual_retry")}
                      >
                        실행 없음 확인 · 나중 수동 재시도 허용
                      </button>
                    ) : (
                      <p className="mt-3 text-xs font-bold text-red-700">잠금을 유지했습니다. 증거 파일을 별도로 점검해야 합니다.</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            <ResultNote result={automationRecoveryResult} />
            <ResultNote result={automationAdvanceResult} />
            <ResultNote result={automationPlanResult} />
          </section>
        ) : null}

        {localDev === true && showAdvancedOperations ? (
          <section data-testid="wizard-upload-ready-library" className="border-y border-emerald-200 bg-emerald-50/60 px-5 py-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-bold text-slate-900">완성 영상 불러오기</h3>
                <p className="mt-1 text-sm text-slate-600">이미 만든 최종 영상을 다시 열어, 게시 전 점검과 실제 업로드만 진행합니다.</p>
              </div>
              <button
                type="button"
                data-testid="wizard-action-refresh-upload-ready"
                className="px-4 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 text-sm font-bold transition-colors disabled:opacity-40"
                disabled={uploadReadyState === "running" || !runnable}
                onClick={() => void refreshUploadReadyList()}
              >
                목록 새로고침
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <input
                type="search"
                data-testid="wizard-upload-ready-search"
                value={uploadReadyQuery}
                onChange={(event) => setUploadReadyQuery(event.target.value)}
                placeholder="주제명으로 찾기"
                className="w-full max-w-sm rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-sm font-semibold text-emerald-800">업로드 대기 {uploadReadyItems.length}개</span>
            </div>
            {uploadReadyState === "running" ? <p className="mt-3 text-sm font-semibold text-emerald-800">완성 영상을 확인하는 중입니다.</p> : null}
            {uploadReadyState === "success" && filteredUploadReadyItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">업로드 대기 중인 완성 영상이 없습니다.</p>
            ) : null}
            <div className="mt-3 space-y-2">
              {filteredUploadReadyItems.map((item) => {
                const selected = selectedTopicId === item.topicId;
                const blocked = item.status === "needs_attention";
                return (
                  <div
                    key={item.topicId}
                    data-testid="wizard-upload-ready-item"
                    className={`border px-4 py-3 ${selected ? "border-emerald-500 bg-white" : "border-emerald-200 bg-white/80"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-slate-900">{item.title}</p>
                        <p className={`mt-0.5 text-sm ${blocked ? "text-amber-700" : "text-slate-600"}`}>{item.detail}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.totalParts > 1 ? `${item.totalParts}편` : "단편"}
                          {item.totalDurationSec != null ? ` · ${item.totalDurationSec.toFixed(1)}초` : ""}
                          {item.updatedAt ? ` · ${new Date(item.updatedAt).toLocaleString("ko-KR")}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="wizard-action-load-upload-ready"
                        className={`shrink-0 px-4 py-2 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          blocked ? "bg-amber-700 hover:bg-amber-800" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                        disabled={!runnable}
                        title={blocked ? "게시 복구 증거를 확인합니다. 일반 양쪽 업로드는 차단됩니다." : "완성 영상을 불러옵니다."}
                        onClick={() => selectUploadReadyItem(item)}
                      >
                        {blocked ? "상태 보기" : "불러오기"}
                      </button>
                    </div>
                    {blocked ? (
                      <PublishRecoveryEvidence
                        topicId={item.topicId}
                        states={item.recoveryStates ?? []}
                        disabled={!runnable}
                        onResolved={async () => {
                          await refreshUploadReadyList();
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
            <ResultNote result={uploadReadyResult} />
          </section>
        ) : null}

        {/* 1. 카테고리 선택 */}
        <StepCard
          num={1}
          title="카테고리 선택"
          state={category ? "success" : "idle"}
          desc="현재 재테크팁 전용 화면입니다. 재테크 주제를 골라 추천받으세요."
        >
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`wizard-category-${c.id}`}
                  onClick={() => selectCategory(c.id)}
                  className={`px-4 py-2 rounded-xl border text-[15px] font-semibold transition-colors ${
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {category && CATEGORY_DESC[category] ? (
            <p className="text-sm text-slate-500 mt-2">{CATEGORY_DESC[category]}</p>
          ) : null}
        </StepCard>

        {/* 2. 새 주제 추천 */}
        <StepCard
          num={2}
          title="새 주제 추천"
          state={topicState}
          desc="재테크팁은 제목·문제·반전·행동을 함께 보고 판정합니다. '만든다'로 고른 후보만 대본으로 넘어갑니다."
        >
          {category === "finance" ? (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {FINANCE_SUBTOPICS.map((s) => {
                  const selected = financeSubtopic === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-testid={`wizard-finance-subtopic-${s.id}`}
                      onClick={() => selectFinanceSubtopic(s.id)}
                      className={`px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        selected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300"
                      }`}
                      title={s.desc}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                선택: {FINANCE_SUBTOPIC_LABELS[financeSubtopic] ?? "전체"}
              </p>
            </div>
          ) : null}
          <button data-testid="wizard-action-topic-recommend" type="button" className={RUN_BTN} disabled={!runnable || !category} onClick={runTopicRecommend}>
            주제 추천받기
          </button>
          {topics.length > 0 ? (
            <button
              type="button"
              className="ml-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-[15px] font-semibold transition-colors disabled:opacity-40"
              disabled={!runnable || !category}
              onClick={runTopicRecommend}
            >
              다른 주제 보기
            </button>
          ) : null}
          {!category ? <p className="text-sm text-slate-400 mt-2">먼저 카테고리를 선택해 주세요.</p> : null}
          <ResultNote result={topicResult} />
          {editorialSummary && category === "finance" ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-slate-700">편집 판정 {editorialSummary.total}개</span>
              <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">만든다 {editorialSummary.make}</span>
              <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">애매 {editorialSummary.maybe}</span>
              <span className="rounded-md bg-rose-50 px-2 py-1 font-semibold text-rose-700">버린다 {editorialSummary.reject}</span>
              <span className="text-slate-500">주제은행 미판정 {editorialSummary.remainingCalibration}</span>
            </div>
          ) : null}
          {preferenceMessage ? <p className="mt-2 text-sm font-semibold text-indigo-700">{preferenceMessage}</p> : null}
          {topics.length > 0 ? (
            <div className="mt-3 space-y-2">
              {topics.map((t) => {
                const selected = selectedTopicId === t.topicId;
                const isEditorialCandidate = t.requiresEditorialDecision === true;
                return (
                  <div
                    key={t.topicId}
                    data-testid="wizard-topic-card"
                    data-topic-id={t.topicId}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {!isEditorialCandidate || t.editorialDecision === "make" ? (
                      <input
                        type="radio"
                        name="wizard-topic"
                        data-testid="wizard-topic-select"
                        className="mt-1.5 accent-indigo-600 scale-125"
                        checked={selected}
                        onChange={() => selectTopic(t.topicId)}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{t.title}</span>
                        {t.angle && !isEditorialCandidate ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold">
                            {t.angle}형
                          </span>
                        ) : null}
                        {t.editorialDecision === "make" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                            만든다
                          </span>
                        ) : t.editorialDecision === "maybe" ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                            애매
                          </span>
                        ) : t.editorialDecision === "reject" ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                            버린다
                          </span>
                        ) : t.scriptReady ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            대본 가능
                          </span>
                        ) : isEditorialCandidate ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                            판정 필요
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs">
                            대본 연결 전
                          </span>
                        )}
                        {typeof t.qualityScore === "number" ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                            품질 {t.qualityScore}
                          </span>
                        ) : null}
                        {t.source === "claude_generated" && typeof t.qualityScore === "number" ? (
                          t.qualityScore >= 90 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                              추천
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
                              후보
                            </span>
                          )
                        ) : null}
                        {t.source === "claude_generated" ? (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
                            AI 신규
                          </span>
                        ) : t.source === "local_bank" ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
                            백업
                          </span>
                        ) : null}
                        {t.financeSubtopic && FINANCE_SUBTOPIC_LABELS[t.financeSubtopic] ? (
                          <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
                            {FINANCE_SUBTOPIC_LABELS[t.financeSubtopic]}
                          </span>
                        ) : null}
                        {t.rewrittenReasons && t.rewrittenReasons.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs" title={t.rewrittenReasons.join(", ")}>
                            다듬음
                          </span>
                        ) : null}
                      </span>
                      {isEditorialCandidate ? (
                        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
                          <div className="border-l-2 border-rose-300 pl-3">
                            <p className="text-xs font-bold text-rose-600">찌르는 문제</p>
                            <p className="mt-0.5 leading-relaxed">{t.problemStatement}</p>
                          </div>
                          <div className="border-l-2 border-amber-300 pl-3">
                            <p className="text-xs font-bold text-amber-700">놓친 반전</p>
                            <p className="mt-0.5 leading-relaxed">{t.twist}</p>
                          </div>
                          <div className="border-l-2 border-emerald-300 pl-3">
                            <p className="text-xs font-bold text-emerald-700">가져갈 행동</p>
                            <p className="mt-0.5 leading-relaxed">{t.takeawayAction}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {t.hook ? <span className="block text-[15px] text-slate-600 mt-1">“{t.hook}”</span> : null}
                          {t.reason ? <span className="block text-sm text-slate-400 mt-0.5">{t.reason}</span> : null}
                        </>
                      )}
                      {t.noveltyNote ? <span className="block text-xs text-slate-400 mt-0.5">{t.noveltyNote}</span> : null}
                      {isEditorialCandidate ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            data-testid="wizard-topic-make"
                            disabled={preferenceBusyId !== null}
                            onClick={() => void runTopicPreference(t.topicId, "make")}
                            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            만든다
                          </button>
                          <button
                            type="button"
                            disabled={preferenceBusyId !== null}
                            onClick={() => void runTopicPreference(t.topicId, "maybe")}
                            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                          >
                            애매
                          </button>
                          <button
                            type="button"
                            disabled={preferenceBusyId !== null}
                            onClick={() => void runTopicPreference(t.topicId, "reject")}
                            className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            버린다
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </StepCard>

        {/* 3. 대본 만들기 */}
        <StepCard
          num={3}
          title="대본 만들기"
          state={scriptState}
          desc="고른 주제로 쇼츠 대본을 만듭니다. 훅 문장과 전체 낭독문을 보여줍니다."
        >
          <button data-testid="wizard-action-script" type="button" className={RUN_BTN} disabled={!runnable || !selectedTopicId} onClick={runScriptPreview}>
            대본 만들기
          </button>
          {!selectedTopicId ? <p className="text-sm text-slate-400 mt-2">먼저 주제를 골라 주세요.</p> : null}
          <ResultNote result={scriptResult} />
          {script ? (
            <div className="mt-3 space-y-4">
              {/* 품질 게이트 통과 전에는 검수본으로만 표시하고 실제 제작 단계를 닫는다. */}
              <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 px-5 py-5">
                <p className="text-base font-bold text-indigo-700 mb-1">{scriptFinalReady ? "확정 대본" : "대본 검수본"}</p>
                <p className="text-sm text-slate-500 mb-3">
                  {scriptFinalReady
                    ? "문장 내용과 순서는 그대로 사용하고, 실제 목소리 단계에서 장면에 맞는 억양·강조·호흡을 자동으로 보정합니다."
                    : "품질 기준을 통과하지 않아 실제 목소리·이미지·영상 단계로는 넘기지 않습니다."}
                </p>
                <p className="text-lg text-slate-900 leading-relaxed">{script.fullVoiceover}</p>
              </div>

              {script.videoStrategy ? (
                <div className="border-l-4 border-rose-400 bg-white px-5 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-700">최종 영상 구성</p>
                    <span className="text-xs font-semibold text-rose-700">
                      {effectiveVideoStrategyMode === "two_part"
                        ? `실제 제작 기준 ${productionPartCount}편`
                        : "실제 제작 기준 단편"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {videoStrategyDisplayMismatch
                      ? effectiveVideoStrategyMode === "two_part"
                        ? "대본 제안은 단편이었지만 실제 제작 길이 검사에서 공통 의미 게이트 5개를 모두 통과해 2편으로 확정했습니다. 길이만으로 자르지 않았습니다."
                        : "대본 제안과 달리 실제 제작 계획은 한 영상으로 확정되었습니다. 아래에는 실제 제작 구성을 표시합니다."
                      : effectiveVideoStrategyMode === "two_part"
                        ? "문제 진단과 실행 방법이 각각 독립적으로 완결되고 자연스럽게 이어질 때만 연속 2편으로 제안합니다. 길이만으로 나누지 않습니다."
                        : "이 주제는 한 영상 안에서 메시지가 완결되어 단편으로 제안했습니다. 길이만으로 2편으로 나누지 않습니다."}
                  </p>
                  {videoStrategyDisplayMismatch ? (
                    realMedia && realMedia.parts.length > 0 ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {realMedia.parts.map((part) => (
                          <div key={part.id} className="border-t border-slate-200 pt-3">
                            <p className="text-xs font-bold text-slate-500 mb-1">
                              {part.totalParts > 1 ? `${part.partNumber}편 실제 제작` : "실제 제작"}
                            </p>
                            <p className="text-lg font-bold text-slate-900">{part.platformTitle || part.canonicalTitle}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm font-semibold text-slate-500">실제 제작 구성을 확인하고 있습니다.</p>
                    )
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {script.videoStrategy.parts.map((part) => (
                        <div key={part.id} className="border-t border-slate-200 pt-3">
                          <p className="text-xs font-bold text-slate-500 mb-1">
                            {part.totalParts > 1 ? `${part.partNumber}편 첫 화면` : "첫 화면"}
                          </p>
                          {part.coverHookAudit ? (
                            <p className={`mb-1 text-xs font-bold ${part.coverHookAudit.passed ? "text-emerald-700" : "text-red-700"}`}>
                              {part.coverHookAudit.passed ? "후킹 검증 통과 · 유료 음성 진행 가능" : "후킹 검증 실패 · 유료 음성 차단"}
                            </p>
                          ) : null}
                          {part.coverLines.map((line, index) => (
                            <p
                              key={`${part.id}-${index}`}
                              className={index === 2 ? "text-xl font-bold text-rose-600" : "text-lg font-bold text-slate-900"}
                            >
                              {line.displayText}
                            </p>
                          ))}
                          {part.bridgeNarration ? (
                            <p className="mt-2 text-sm font-semibold text-indigo-700 whitespace-pre-line">{part.bridgeNarration}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* 대본 생성 방식 — 로컬 후보 선별 → Claude 1회 보정 (적용 여부 표시) */}
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-600">대본 생성 방식: 로컬 후보 선별 → Claude 1회 보정</p>
                  {scriptState === "blocked" ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      품질 기준 미달
                    </span>
                  ) : scriptEngine?.claudeApplied ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      Claude 보정 적용됨
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                      Claude 보정 미적용 — 로컬 대본 사용 중
                    </span>
                  )}
                </div>
                {scriptState === "blocked" ? (
                  <p className="text-sm text-rose-700 mt-1">이 검수본은 실제 제작 단계에 저장되지 않았습니다.</p>
                ) : scriptEngine && !scriptEngine.claudeApplied ? (
                  <p className="text-sm text-slate-500 mt-1">{scriptEngine.note}</p>
                ) : null}
                {scriptEngine?.claudeApplied && scriptEngine.rewriteNotes.length > 0 ? (
                  <details className="mt-1.5">
                    <summary className="text-[13px] text-slate-400 cursor-pointer">Claude가 고친 부분 보기</summary>
                    <ul className="mt-1 text-sm text-slate-600 space-y-0.5">
                      {scriptEngine.rewriteNotes.map((n, i) => (
                        <li key={i}>· {n}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>

              {/* 대본 품질 점수 — 좋은 이유 / 고친 부분 / 주의할 점 (2~4줄 요약) */}
              {script.quality ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-emerald-700">대본 품질 점수</p>
                    <span className="text-2xl font-bold text-emerald-700">
                      {script.quality.overallScore}
                      <span className="text-sm font-normal text-emerald-600">/100</span>
                    </span>
                  </div>
                  {script.selectedStyle ? (
                    <p className="text-sm text-slate-500 mb-3">
                      후보 {script.candidateScores?.length ?? 3}개 중 <b className="text-slate-700">{script.selectedStyle}</b>을 골랐습니다.
                    </p>
                  ) : null}
                  <div className="space-y-2.5">
                    {script.qualitySummary?.goodReasons?.length ? (
                      <div>
                        <p className="text-[13px] font-bold text-emerald-700 mb-0.5">좋은 이유</p>
                        <ul className="text-[15px] text-slate-700 space-y-0.5">
                          {script.qualitySummary.goodReasons.map((r, i) => (
                            <li key={i}>· {r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {script.qualitySummary?.fixedParts?.length ? (
                      <div>
                        <p className="text-[13px] font-bold text-indigo-700 mb-0.5">고친 부분</p>
                        <ul className="text-[15px] text-slate-700 space-y-0.5">
                          {script.qualitySummary.fixedParts.map((r, i) => (
                            <li key={i}>· {r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {script.qualitySummary?.watchOuts?.length ? (
                      <div>
                        <p className="text-[13px] font-bold text-amber-700 mb-0.5">주의할 점</p>
                        <ul className="text-[15px] text-slate-700 space-y-0.5">
                          {script.qualitySummary.watchOuts.map((r, i) => (
                            <li key={i}>· {r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <details className="mt-3">
                    <summary className="text-[13px] text-slate-400 cursor-pointer">개발자용 점수 자세히 보기</summary>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-slate-500">
                      <span>붙잡는 힘 {script.quality.retentionScore}</span>
                      <span>내 얘기 같음 {script.quality.selfRecognitionScore}</span>
                      <span>명확함 {script.quality.clarityScore}</span>
                      <span>영상화 {script.quality.visualizabilityScore}</span>
                      <span>말투 자연스러움 {script.quality.antiAiToneScore}</span>
                      <span>구체성 {script.quality.specificityScore}</span>
                    </div>
                    {script.candidateScores?.length ? (
                      <div className="mt-2 text-[13px] text-slate-500">
                        후보 점수:{" "}
                        {script.candidateScores.map((c) => `${c.style} ${c.overallScore}${c.selected ? "★" : ""}`).join(" · ")}
                      </div>
                    ) : null}
                  </details>
                </div>
              ) : null}

              {/* 첫 3초 훅 — 대본 첫 세 문장을 따로 강조 */}
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm font-bold text-indigo-600 mb-1">첫 3초 훅</p>
                <p className="text-xl font-bold text-slate-900 leading-snug">
                  “{script.captionLines?.slice(0, 3).join(" ") ?? script.hookLine ?? script.hook}”
                </p>
              </div>

              {/* 영상에 들어갈 자막 */}
              {script.captionLines && script.captionLines.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-bold text-indigo-600 mb-2">영상에 들어갈 자막 {script.captionLines.length}개</p>
                  <ol className="space-y-1.5">
                    {script.captionLines.map((c, i) => (
                      <li key={i} className="flex gap-2.5 text-[15px] text-slate-800">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">“{c}”</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {/* 장면 그림 + Veo 후보 계획 — 보조 정보 */}
              {script.scenes && script.scenes.length > 0 ? (
                <details className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <summary className="text-sm font-bold text-indigo-600 cursor-pointer">
                    장면 그림 계획 (보조 정보)
                  </summary>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    모든 이미지를 영상화하지 않습니다. 행동 효과가 큰 장면만 Flow 변환 후보로 자동 표시하며,
                    {` 이 영상은 최대 ${script.scenes[0]?.mediaStrategyMaxVeoScenes ?? 0}개까지 사용합니다.`}
                  </p>
                  <div className="mt-3 space-y-2">
                    {script.scenes.map((s, sceneIndex) => (
                      <div key={`${sceneIndex}-${s.id}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-700">{s.label}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${
                            s.mediaStrategy === "veo_motion"
                              ? "border-violet-200 bg-violet-50 text-violet-700"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}>
                            {s.mediaStrategy === "veo_motion" ? "Flow 모션 후보" : "정지 이미지"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">장면 그림: {s.visualCue}</p>
                        {s.mediaStrategy === "veo_motion" ? (
                          <p className="text-xs text-violet-600 mt-1">
                            실제 생성은 Owner 확인 후 진행 · 자동 판정 점수 {s.mediaStrategyScore ?? "-"}
                          </p>
                        ) : s.mediaStrategySource === "budget_cap" ? (
                          <p className="text-xs text-slate-400 mt-1">움직임 후보였지만 영상별 비용 상한에 따라 정지 이미지로 유지</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              {/* SNS 설명글 초안 — 실제 대본이 아님을 분명히 */}
              {script.uploadCaptionDraft ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-bold text-indigo-600 mb-1">SNS 설명글 초안</p>
                  <p className="text-sm text-slate-500 mb-2">
                    업로드할 때 쓰는 설명글입니다. 영상이 읽는 대본과는 다릅니다.
                  </p>
                  <p className="text-[15px] text-slate-700 whitespace-pre-line leading-relaxed">
                    {script.uploadCaptionDraft}
                  </p>
                </div>
              ) : null}

              <p className="text-sm text-slate-500 px-1">
                훅 점수 {script.hookScore ?? "-"}점 · 전달력 점수 {script.clarityScore ?? "-"}점
              </p>
            </div>
          ) : null}
        </StepCard>

        {/* 4. 재테크 영상 주인공 검수 — 캐릭터 후보를 먼저 비교하고 기준 이미지를 확정 */}
        <StepCard
          num={4}
          title="주인공 이미지 검수"
          state={characterCastReady ? "success" : characterCastState}
          desc={characterCastReady
            ? "기준 이미지 4명이 확정됐습니다. 캐릭터를 바꿀 때만 아래 비교 영역을 엽니다."
            : "유사한 재테크 소주제 3개씩을 한 주인공에게 묶었습니다. 각 인물의 후보 2장을 먼저 비교하고 기준 이미지를 선택합니다. 이 단계에서는 영상을 만들지 않습니다."}
        >
          {characterCast ? (
            <div>
              {characterCastReady ? (
                <div data-testid="wizard-character-cast-ready-summary" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-bold text-emerald-800">기준 캐릭터 4명 확정됨</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {characterCast.characters.map((character) => (
                      <div key={character.id} className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                        <p className="text-sm font-semibold text-slate-800">{character.name} · {character.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{character.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <details data-testid="wizard-character-cast-details" open={!characterCastReady} className={characterCastReady ? "mt-3" : undefined}>
                {characterCastReady ? (
                  <summary className="cursor-pointer text-sm font-semibold text-slate-500">캐릭터 변경 또는 후보 비교</summary>
                ) : null}
                <div className={`grid gap-4 lg:grid-cols-2 ${characterCastReady ? "mt-3" : ""}`}>
                  {characterCast.characters.map((character) => (
                    <section key={character.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">{character.name} · {character.label}</p>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{character.role}</p>
                    </div>
                    {character.selectedCandidateNumber ? (
                      <span className="shrink-0 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
                        {character.selectedCandidateNumber}번 선택
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {character.subtopics.map((subtopic) => (
                      <span key={subtopic} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                        {FINANCE_SUBTOPIC_LABELS[subtopic] ?? subtopic}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-testid={`wizard-character-create-${character.id}`}
                    className={`${RUN_BTN} mt-3`}
                    disabled={!runnable || characterCastBusyId !== null}
                    onClick={() => void createCharacterCandidates(character.id, character.candidatesReady)}
                  >
                    {character.candidatesReady ? "후보 이미지 2장 다시 만들기" : "후보 이미지 2장 만들기"}
                  </button>
                  {characterCastBusyId === character.id && characterCastState === "running" ? (
                    <p className="text-sm text-amber-700 font-semibold mt-2">{character.name} 후보 이미지 생성 중…</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {character.candidates.map((candidate) => {
                      const selected = character.selectedCandidateNumber === candidate.candidateNumber;
                      return (
                        <div
                          key={candidate.candidateNumber}
                          className={`overflow-hidden rounded-lg border bg-white ${selected ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"}`}
                        >
                          <div className="relative aspect-[9/16] bg-slate-100">
                            {candidate.ready ? (
                              <Image
                                unoptimized
                                fill
                                sizes="(max-width: 1024px) 45vw, 240px"
                                className="object-cover"
                                alt={`${character.name} 주인공 후보 ${candidate.candidateNumber}`}
                                src={`/api/money-shorts/operator?image=character&characterId=${encodeURIComponent(character.id)}&candidate=${candidate.candidateNumber}&v=${characterImageKey}`}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-slate-400">
                                후보 이미지 생성 전
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <button
                              type="button"
                              data-testid={`wizard-character-select-${character.id}-${candidate.candidateNumber}`}
                              className={`w-full px-3 py-2 rounded-md text-sm font-bold border transition-colors disabled:opacity-40 ${selected ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
                              disabled={!runnable || !candidate.ready || characterCastBusyId !== null}
                              onClick={() => void selectCharacterCandidate(character.id, candidate.candidateNumber)}
                            >
                              {selected ? `${candidate.candidateNumber}번 선택됨` : `${candidate.candidateNumber}번 선택`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    </section>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            <p className="text-sm text-slate-500">주인공 검수 상태를 불러오는 중입니다.</p>
          )}
          <ResultNote result={characterCastResult} />
          <p className="text-sm text-slate-500 mt-3">
            {characterCastReady
              ? "확정된 기준 이미지는 새 장면 이미지 제작에 그대로 사용됩니다."
              : "4명 선택이 끝나야 새 장면 이미지 제작으로 넘어갈 수 있습니다. 선택 이미지는 Owner PC에만 저장됩니다."}
          </p>
        </StepCard>

        {/* 5. 실제 목소리 만들기 — 확정 대본 기반 ElevenLabs 고정 목소리(테스트 소리 아님) */}
        <StepCard
          num={5}
          title="실제 목소리 만들기"
          state={
            realTtsReady
              ? "success"
              : realTtsState === "running" ||
                  realTtsApprovalState === "running"
                ? "running"
                : realTtsApprovalState === "error"
                  ? "error"
                  : "idle"
          }
          desc="실제 음성을 만든 뒤 모든 편을 직접 듣고 승인해야 다음 제작 단계로 넘어갑니다."
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-real-tts"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !scriptFinalReady}
              onClick={runRealTts}
            >
              실제 목소리 만들기
            </button>
            {realTtsReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                Owner 청취 승인 완료 ({realMedia?.realTts.durationSec?.toFixed(1) ?? "?"}초)
              </span>
            ) : realTtsGenerated ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                생성 완료 · 청취 승인 필요
              </span>
            ) : realMedia && realMedia.scriptEngine.elevenLabsKeyPresent === false ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                음성 키 필요
              </span>
            ) : null}
          </div>
          {!scriptFinalReady ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [대본 만들기]로 대본을 확정해 주세요.</p>
          ) : null}
          {realTtsState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">실제 음성 생성 중… 창을 닫지 마세요.</p>
          ) : null}
          <ResultNote result={realTtsResult} />
          {realTtsGenerated && selectedTopicId ? (
            <div className="mt-3 space-y-3">
              {(realMedia?.parts ?? []).map((part) => (
                <div key={part.id}>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {part.totalParts > 1 ? `${part.partNumber}편 음성` : "최종 음성"} · {part.realTts.durationSec?.toFixed(1) ?? "?"}초
                  </p>
                  <audio
                    key={`${part.id}-${audioKey}`}
                    controls
                    preload="metadata"
                    className="w-full max-w-[360px]"
                    src={`/api/money-shorts/operator?audio=real&topicId=${encodeURIComponent(selectedTopicId)}&part=${part.id}&v=${audioKey}`}
                  />
                </div>
              ))}
              {!realTtsReady ? (
                <div
                  data-testid="wizard-tts-owner-listening-gate"
                  className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3"
                >
                  <p className="text-sm font-bold text-amber-900">
                    모든 편을 끝까지 들어본 뒤 현재 음성을 승인해 주세요.
                  </p>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={confirmTtsListenedAllParts}
                      onChange={(event) =>
                        setConfirmTtsListenedAllParts(event.target.checked)
                      }
                    />
                    모든 편의 실제 음성을 직접 들었습니다.
                  </label>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={confirmTtsVoiceQuality}
                      onChange={(event) =>
                        setConfirmTtsVoiceQuality(event.target.checked)
                      }
                    />
                    발음·억양·속도·감정이 최종 영상에 사용할 품질입니다.
                  </label>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={confirmTtsDownstreamUse}
                      onChange={(event) =>
                        setConfirmTtsDownstreamUse(event.target.checked)
                      }
                    />
                    이 음성을 이미지·Veo·렌더·게시 후보에 사용하는 데 동의합니다.
                  </label>
                  <input
                    type="text"
                    value={confirmTtsApprovalText}
                    onChange={(event) =>
                      setConfirmTtsApprovalText(event.target.value)
                    }
                    placeholder="음성 승인"
                    className="w-full max-w-sm rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    data-testid="wizard-action-real-tts-quality-accept"
                    className={RUN_BTN}
                    disabled={!runnable || !realTtsApprovalReady}
                    onClick={acceptRealTtsQuality}
                  >
                    현재 음성 청취 승인
                  </button>
                  <ResultNote result={realTtsApprovalResult} />
                </div>
              ) : (
                <p className="text-sm text-emerald-700 font-semibold">
                  승인 지문{" "}
                  {realMedia?.realTts.qualityApprovalFingerprint?.slice(
                    0,
                    16,
                  ) ?? "확인됨"}
                  · 현재 오디오가 바뀌면 자동으로 재승인이 필요합니다.
                </p>
              )}
            </div>
          ) : null}
          <details className="mt-3">
            <summary className="text-[13px] text-slate-400 cursor-pointer">테스트 소리 만들기 (참고용 · 업로드 불가)</summary>
            <div className="mt-2">
              <button type="button" className={RUN_BTN} disabled={!runnable || !selectedTopicId} onClick={runVoiceSample}>
                테스트 소리 만들기
              </button>
              <p className="text-sm text-slate-500 mt-2">실제 음성이 아닌 기계음입니다. 업로드 게이트에서 차단됩니다.</p>
              <ResultNote result={voiceResult} />
            </div>
          </details>
        </StepCard>

        {/* 6. 장면 이미지 만들기 — 확정 대본 장면 수 기준 ChatGPT 실제 이미지 */}
        <StepCard
          num={6}
          title="장면 이미지 만들기"
          state={realImagesReady ? "success" : imageReviewState === "running" ? "running" : realImagesReviewable ? "blocked" : imagesState}
          desc={imageStepDescription}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-real-images"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !scriptFinalReady || !realTtsReady || !characterCastReady || !characterReferenceEngineReady || realImagesReviewable}
              onClick={runSceneImages}
            >
              장면 이미지 만들기
            </button>
            {realImagesReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                전체 이미지 Owner 승인 완료 {realMedia.realImages.generatedCount}/{realMedia.realImages.expectedCount ?? "?"}
              </span>
            ) : realImagesReviewable ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                전체 이미지 생성 완료 · Owner 검수 필요 ({realMedia?.realImages.generatedCount}/{realMedia?.realImages.expectedCount ?? "?"})
              </span>
            ) : realMedia && realMedia.realImages.generatedCount > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                이미지 생성 미완료 ({realMedia.realImages.generatedCount}/{realMedia.realImages.expectedCount ?? "?"})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-sm">
                이미지 생성 필요
              </span>
            )}
          </div>
          {!scriptFinalReady ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [대본 만들기]로 대본을 확정해 주세요.</p>
          ) : !realTtsReady ? (
            <p className="text-sm text-amber-700 mt-2">
              먼저 모든 편의 실제 음성을 듣고 [현재 음성 청취 승인]을 완료해 주세요.
            </p>
          ) : !characterCastReady ? (
            <p className="text-sm text-amber-700 mt-2">먼저 [주인공 이미지 검수]에서 4명의 기준 이미지를 선택해 주세요.</p>
          ) : realImagesReviewable ? (
            <p className="text-sm text-amber-700 mt-2">
              아래 모든 장면을 직접 확인하세요. 문제가 있는 장면은 체크해 선택 장면만 다시 만들고, 실패 장면이 하나도 없을 때 현재 이미지 세트를 승인합니다.
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              로그인된 Chrome(AI-GPT-1 프로필)의 ChatGPT로 생성합니다. 담당 주인공의 확정 이미지는 인물 장면에만 첨부하고,
              장면마다 공간·주요 소재·구도·조명을 다르게 만듭니다. 중간에 멈추면 다시 눌러 모자란 장면만 이어서 만듭니다.
            </p>
          )}
          {imagesState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">
              장면 이미지 생성 중… 몇 분 걸릴 수 있습니다. 창을 닫지 마세요.
            </p>
          ) : null}
          <ResultNote result={imagesResult} />
          {imageSceneRows.length > 0 ? (
            <div data-testid="wizard-real-scene-image-review-grid" className="mt-4 space-y-4">
              {realMedia?.parts.map((part) => (
                <div key={part.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-3 text-sm font-bold text-slate-800">
                    {part.id === "single" ? "단일편" : `${part.partNumber}편`} · 장면 {part.realImages.scenes.length}개
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {part.realImages.scenes.map((scene) => {
                      const selectionKey = `${part.id}:${scene.sceneIndex}:${scene.imageSha256 ?? "missing"}`;
                      const imageSrc = scene.ready && scene.imageSha256
                        ? `/api/money-shorts/operator?image=scene&topicId=${encodeURIComponent(selectedTopicId ?? "")}&part=${encodeURIComponent(part.id)}&scene=${scene.sceneIndex}&sha256=${scene.imageSha256}&v=${sceneImageKey}`
                        : null;
                      return (
                        <div
                          key={selectionKey}
                          data-testid={`wizard-real-scene-image-${part.id}-${scene.sceneIndex}`}
                          className={`rounded-xl border p-2 ${selectedFailedScenes[selectionKey] ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}`}
                        >
                          {imageSrc ? (
                            <Image
                              unoptimized
                              src={imageSrc}
                              alt={`${part.id === "single" ? "단일편" : `${part.partNumber}편`} 장면 ${scene.sceneIndex}`}
                              width={scene.width ?? 900}
                              height={scene.height ?? 1200}
                              className="mx-auto max-h-[460px] w-auto rounded-lg bg-slate-100 object-contain"
                            />
                          ) : (
                            <div className="flex min-h-48 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
                              장면 파일 미완료
                            </div>
                          )}
                          <div className="mt-2 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-800">장면 {scene.sceneIndex}</p>
                              <p className="text-xs text-slate-400">
                                {scene.width ?? "?"}×{scene.height ?? "?"} · {scene.imageSha256?.slice(0, 12) ?? "hash 없음"}…
                              </p>
                            </div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                              <input
                                type="checkbox"
                                data-testid={`wizard-select-failed-scene-${part.id}-${scene.sceneIndex}`}
                                disabled={!scene.ready || imagesState === "running"}
                                checked={selectedFailedScenes[selectionKey] === true}
                                onChange={(event) => setSelectedFailedScenes((current) => ({
                                  ...current,
                                  [selectionKey]: event.target.checked,
                                }))}
                              />
                              실패 장면
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {realImagesReviewable ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-bold text-red-800">
                  실패 장면 {selectedImageScenes.length}개 선택
                </p>
                <p className="mt-1 text-xs text-red-700">
                  선택 장면만 각 1회 다시 만들며 자동 재시도하지 않습니다. 선택하지 않은 장면의 파일과 해시는 그대로 보존합니다.
                </p>
                <label className="mt-3 flex items-start gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={confirmSelectedRegeneration}
                    onChange={(event) => setConfirmSelectedRegeneration(event.target.checked)}
                  />
                  <span>위에 체크한 현재 장면만 외부 이미지 생성으로 다시 만드는 것을 확인했습니다.</span>
                </label>
                <input
                  type="text"
                  value={confirmSelectedRegenerationText}
                  onChange={(event) => setConfirmSelectedRegenerationText(event.target.value)}
                  placeholder="선택 장면 재생성"
                  className="mt-2 w-full max-w-sm rounded-lg border border-red-300 bg-white px-3 py-2 text-sm"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    data-testid="wizard-action-regenerate-selected-scene-images"
                    className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40"
                    disabled={!runnable || !selectedImageRegenerationReady}
                    onClick={regenerateSelectedSceneImages}
                  >
                    선택한 실패 장면만 재생성
                  </button>
                </div>
              </div>
              {!realImagesReady ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-bold text-amber-900">현재 전체 이미지 세트 승인</p>
                  <p className="mt-1 text-xs text-amber-800">
                    실패 장면 선택이 0개일 때만 승인할 수 있습니다. 현재 해시 묶음이 바뀌면 승인은 자동으로 무효화됩니다.
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-start gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={confirmImagesReviewedAll} onChange={(event) => setConfirmImagesReviewedAll(event.target.checked)} />
                      <span>모든 편의 모든 장면 이미지를 크게 확인했습니다.</span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={confirmImageVisualQuality} onChange={(event) => setConfirmImageVisualQuality(event.target.checked)} />
                      <span>실패 장면이 없고 내용 전달·인물 연속성·밝기·무문자 품질을 수용합니다.</span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={confirmImageDownstreamUse} onChange={(event) => setConfirmImageDownstreamUse(event.target.checked)} />
                      <span>현재 이미지 세트를 Veo 준비와 최종 렌더에 사용하는 것을 승인합니다.</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={confirmImageApprovalText}
                    onChange={(event) => setConfirmImageApprovalText(event.target.value)}
                    placeholder="이미지 승인"
                    className="mt-3 w-full max-w-sm rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                  />
                  <div className="mt-2">
                    <button
                      type="button"
                      data-testid="wizard-action-real-images-review-accept"
                      className={RUN_BTN}
                      disabled={!runnable || !imageReviewApprovalReady}
                      onClick={acceptRealSceneImagesQuality}
                    >
                      현재 전체 이미지 승인
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold text-emerald-700">
                  현재 이미지 세트 승인 완료 · {realMedia?.realImages.manualVisualReview.imageSetSha256?.slice(0, 16) ?? "hash 확인"}…
                </p>
              )}
              <ResultNote result={imageReviewResult} />
            </div>
          ) : null}
        </StepCard>

        {/* 7. Veo 모션 준비 — 자동 선정 장면의 로컬 패킷/상태만 생성 */}
        <StepCard
          num={7}
          title="Veo 모션 준비"
          state={
            flowMotion?.state === "render_ready" || flowMotion?.state === "not_required"
              ? "success"
              : flowMotion?.state === "qa_failed"
                ? "error"
                : flowMotion?.state === "generating" || flowMotion?.state === "qa_pending" || flowMotion?.state === "qa_pass"
                  ? "running"
                  : flowMotion?.state === "approval_pending"
                    ? "blocked"
                    : flowMotionState
          }
          desc="자동 선정된 장면만 Google Flow용 이미지·프롬프트 해시 패킷으로 묶고 승인 상태를 관리합니다. 이 단계에서는 브라우저를 열거나 크레딧을 사용하지 않습니다."
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-flow-motion-prepare"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !realTtsReady || !realImagesReady || selectedFlowMotionSceneCount === 0}
              onClick={runFlowMotionPrepare}
            >
              Flow 작업 패킷 준비
            </button>
            {flowMotion ? (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-semibold">
                {FLOW_MOTION_STATUS_LABEL[flowMotion.state]} · 렌더 준비 {flowMotion.renderReadyCount}/{flowMotion.requiredCount}
              </span>
            ) : null}
          </div>
          {!realTtsReady ? (
            <p className="text-sm text-amber-700 mt-2">현재 실제 음성의 Owner 청취 승인이 필요합니다.</p>
          ) : !realImagesReady ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [장면 이미지 만들기]를 완료해 주세요.</p>
          ) : selectedFlowMotionSceneCount === 0 ? (
            <p className="text-sm text-slate-500 mt-2">이 대본에는 영상화가 필요한 장면이 없습니다. 정지 이미지 모션으로 합성합니다.</p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              자동 선정된 {selectedFlowMotionSceneCount}개 장면만 준비합니다. 패킷에는 기준 이미지·프롬프트의 SHA-256과 정확한 승인 문구가
              들어가며, 실제 생성 전송은 별도 Owner 승인과 검수가 필요합니다.
            </p>
          )}
          {flowMotionState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">로컬 Flow 작업 패킷 생성 중…</p>
          ) : null}
          <ResultNote result={flowMotionResult} />
          {flowMotionPrepared && flowMotion?.parts.some((part) => part.jobs.length > 0) ? (
            <details className="mt-3">
              <summary className="text-[13px] text-slate-500 cursor-pointer">장면별 Flow 상태와 승인 문구</summary>
              <div className="mt-2 space-y-3">
                {flowMotion.parts.flatMap((part) =>
                  part.jobs.map((job) => (
                    <div key={job.jobId} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {part.id === "single" ? "단일편" : `${part.partNumber}편`} · 장면 {job.sceneNumber} · {job.status === "render_ready" && !job.renderAssetReady ? "검수 파일 불일치" : FLOW_MOTION_STATUS_LABEL[job.status]}
                      </p>
                      <p className="mt-1 break-all">패킷: {job.packetPath}</p>
                      <p className="mt-2 break-words text-xs text-slate-500">{job.requiredApprovalWording}</p>
                      {job.creditUsageStatus === "unknown" ? (
                        <p
                          data-testid={`wizard-flow-motion-credit-review-${job.jobId}`}
                          className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
                        >
                          Flow 승인 클릭 결과가 불명확합니다. 전송·크레딧 사용 여부를 수동 확인하기 전에는 새 생성을 진행할 수 없습니다.
                        </p>
                      ) : null}
                      {job.creditUsageStatus !== "unknown" && (job.status === "approval_pending" || job.status === "qa_failed") ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            data-testid={`wizard-flow-motion-approval-${job.jobId}`}
                            className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-700"
                            placeholder="위 승인 문구 전체를 그대로 붙여 넣으세요"
                            value={flowMotionApprovalInputs[job.jobId] ?? ""}
                            onChange={(event) => setFlowMotionApprovalInputs((current) => ({ ...current, [job.jobId]: event.target.value }))}
                          />
                          <button
                            type="button"
                            data-testid={`wizard-action-flow-motion-generate-${job.jobId}`}
                            className={RUN_BTN}
                            disabled={flowMotionState === "running" || (flowMotionApprovalInputs[job.jobId] ?? "") !== job.requiredApprovalWording}
                            onClick={() => void runFlowMotionGenerate(job.jobId)}
                          >
                            승인하고 Flow 영상 1개 생성
                          </button>
                          <p className="text-xs text-amber-700">Veo 3.1 Fast · 9:16 · 1개 · 예상 20크레딧. Gemini 2 우선, 명시적 한도 소진일 때만 3/4로 이동합니다.</p>
                        </div>
                      ) : null}
                      {job.status === "generating" ? (
                        <p className="mt-2 text-xs font-semibold text-amber-700">Flow가 생성·다운로드 중입니다. 자동 재시도나 다른 계정 전환은 하지 않습니다.</p>
                      ) : null}
                      {job.status === "qa_pending" ? (
                        <div className="mt-3 space-y-3">
                          <p className="text-xs font-semibold text-slate-700">
                            {job.creditUsageStatus === "unknown"
                              ? "Flow · 전송·크레딧 사용 여부 수동 확인 필요"
                              : `${job.execution.selectedProfile ?? "Flow"} · 전송 ${job.execution.submissionCount}회 · 예상 사용 ${job.execution.expectedCreditsSpent}크레딧`} · 영상 hash {job.outputVideoSha256?.slice(0, 12)}…
                          </p>
                          <video
                            data-testid={`wizard-flow-motion-preview-${job.jobId}`}
                            className="mx-auto max-h-[520px] w-auto max-w-full rounded-lg bg-black"
                            controls
                            preload="metadata"
                            src={`/api/money-shorts/operator?video=flow-motion&topicId=${encodeURIComponent(selectedTopicId ?? "")}&jobId=${encodeURIComponent(job.jobId)}`}
                          />
                          <div className="space-y-1.5">
                            {FLOW_MOTION_QA_ITEMS.map(([key, label]) => (
                              <label key={key} className="flex items-start gap-2 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  className="mt-0.5"
                                  checked={flowMotionQaChecks[job.jobId]?.[key] === true}
                                  onChange={(event) => setFlowMotionQaChecks((current) => ({
                                    ...current,
                                    [job.jobId]: { ...current[job.jobId], [key]: event.target.checked },
                                  }))}
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                          <textarea
                            className="min-h-16 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                            placeholder="불합격 사유 메모(선택)"
                            value={flowMotionQaNotes[job.jobId] ?? ""}
                            onChange={(event) => setFlowMotionQaNotes((current) => ({ ...current, [job.jobId]: event.target.value }))}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              data-testid={`wizard-action-flow-motion-qa-pass-${job.jobId}`}
                              className={RUN_BTN}
                              disabled={flowMotionState === "running" || FLOW_MOTION_QA_ITEMS.some(([key]) => flowMotionQaChecks[job.jobId]?.[key] !== true)}
                              onClick={() => void runFlowMotionQaPass(job.jobId)}
                            >
                              7항목 통과 · 렌더에 사용
                            </button>
                            <button
                              type="button"
                              data-testid={`wizard-action-flow-motion-qa-fail-${job.jobId}`}
                              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40"
                              disabled={flowMotionState === "running"}
                              onClick={() => void runFlowMotionQaFail(job.jobId)}
                            >
                              불합격 · 후보 보존
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )),
                )}
              </div>
            </details>
          ) : null}
        </StepCard>

        {/* 8. 최종 영상 만들기 — 실제 음성 + 실제 이미지 + 자막 + 모션 */}
        <StepCard
          num={8}
          title="최종 영상 만들기"
          state={finalVideoReady ? "success" : !realImagesReady || !flowMotionReadyForRender ? "blocked" : finalVideoState}
          desc={finalVideoStepDescription}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-final-video"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !realTtsReady || !realImagesReady || !flowMotionReadyForRender}
              onClick={runFinalVideo}
            >
              최종 영상 만들기
            </button>
            {finalVideoReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                최종 영상 {productionPartCount}개 준비 (합계 {realMedia?.finalVideo.durationSec ?? "?"}초)
              </span>
            ) : null}
          </div>
          {!realTtsReady || !realImagesReady ? (
            <p className="text-sm text-slate-400 mt-2">
              먼저 [실제 목소리 만들기]와 [장면 이미지 만들기]를 완료해 주세요. 테스트 소리·색상 카드로는 최종 영상을
              만들 수 없습니다.
            </p>
          ) : !flowMotionReadyForRender ? (
            <p className="text-sm text-amber-700 mt-2">
              자동 선정된 Veo 장면이 아직 렌더 준비 상태가 아닙니다. [Veo 모션 준비]에서 생성 승인·영상 검수까지 완료해야
              최종 영상을 만들 수 있습니다.
            </p>
          ) : null}
          {finalVideoState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">최종 영상 합성 중… 창을 닫지 마세요.</p>
          ) : null}
          <ResultNote result={finalVideoResult} />
          <details className="mt-3">
            <summary className="text-[13px] text-slate-400 cursor-pointer">시안 영상 만들기 (색상 카드 · 업로드 불가)</summary>
            <div className="mt-2">
              <button
                type="button"
                className={RUN_BTN}
                disabled={!runnable || !selectedTopicId || !selectedTopic?.scriptReady}
                onClick={runVideoCreate}
              >
                시안 영상 만들기
              </button>
              <p className="text-sm text-slate-500 mt-2">
                장면 이미지 없이 색상 카드로 빠르게 확인하는 테스트용입니다. 업로드 게이트에서 차단됩니다.
              </p>
              <ResultNote result={videoResult} />
            </div>
          </details>
        </StepCard>

        {/* 9. 미리보기·최종 승인 — exact MP4 + 게시 문구 hash를 Owner evidence로 고정 */}
        <StepCard
          num={9}
          title="미리보기 및 최종 승인"
          state={
            finalVideoOwnerApproved
              ? "success"
              : finalVideoReady
                ? finalVideoReviewState === "idle"
                  ? "blocked"
                  : finalVideoReviewState
                : previewState
          }
          desc="모든 최종 MP4를 소리와 함께 재생하고 Instagram·YouTube 게시 문구를 확인한 뒤, 정확한 현재 hash 묶음만 승인합니다."
        >
          <button
            type="button"
            data-testid="wizard-action-preview"
            className={RUN_BTN}
            disabled={!runnable || !selectedTopicId}
            onClick={() => {
              if (selectedTopicId) void refreshRealMedia(selectedTopicId);
              // 최종 영상이 있으면 구형 색상 카드 상태를 조회하지 않는다. 그렇지 않으면
              // 최종 MP4 아래에 "영상 파일 없음"이라는 잘못된 안내가 함께 표시된다.
              if (!finalVideoReady) void runPreviewStatus();
              setPreviewKey((k) => k + 1);
            }}
          >
            미리보기
          </button>
          {finalVideoReady && selectedTopicId ? (
            <div className="mt-3 space-y-5">
              <p className="text-[15px] text-emerald-700 font-semibold mb-1.5">
                최종 영상 {productionPartCount}개 (실제 음성 + 실제 장면 이미지) — 업로드 후보
              </p>
              {(realMedia?.parts ?? []).map((part) => (
                <div key={part.id} className="border-t border-slate-200 pt-3">
                  <p className="text-sm font-bold text-slate-700 mb-2">
                    {part.totalParts > 1 ? `${part.partNumber}편` : "단편"} · {part.platformTitle}
                  </p>
                  <video
                    key={`final-${part.id}-${part.finalVideo.finalMp4Sha256 ?? "missing"}-${previewKey}`}
                    data-testid={part.partNumber === 1 ? "wizard-final-video" : `wizard-final-video-${part.partNumber}`}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-w-[280px] rounded-xl border border-emerald-300 bg-black"
                    src={`/api/money-shorts/operator?video=final&topicId=${encodeURIComponent(selectedTopicId)}&part=${part.id}&sha256=${encodeURIComponent(part.finalVideo.finalMp4Sha256 ?? "")}&v=${previewKey}`}
                  />
                  <a
                    href={`/money-shorts/preview?topicId=${encodeURIComponent(selectedTopicId)}&part=${part.id}&sha256=${encodeURIComponent(part.finalVideo.finalMp4Sha256 ?? "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    크게 보기
                  </a>
                  <p className="text-xs text-slate-400 mt-1 break-all">{part.finalVideo.mp4Path}</p>
                  <p className="text-xs text-slate-500 mt-1 break-all">
                    MP4 SHA-256{" "}
                    {part.finalVideo.finalMp4Sha256 ?? "확인 불가"}
                  </p>
                  {part.finalVideo.publishMetadata ? (
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-pink-200 bg-pink-50/60 p-3">
                        <p className="text-sm font-bold text-pink-800">
                          Instagram 게시 문구
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {part.finalVideo.publishMetadata.instagram.captionFirstLineHook}
                          {"\n\n"}
                          {part.finalVideo.publishMetadata.instagram.caption}
                          {"\n\n"}
                          {part.finalVideo.publishMetadata.instagram.callToAction}
                          {"\n\n"}
                          {part.finalVideo.publishMetadata.instagram.hashtags
                            .map((tag) => `#${tag}`)
                            .join(" ")}
                        </p>
                      </div>
                      <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                        <p className="text-sm font-bold text-red-800">
                          YouTube 게시 문구
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {part.finalVideo.publishMetadata.youtube.title}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {part.finalVideo.publishMetadata.youtube.description}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          태그:{" "}
                          {part.finalVideo.publishMetadata.youtube.tags.join(
                            ", ",
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 break-all lg:col-span-2">
                        게시 문구 SHA-256{" "}
                        {part.finalVideo.publishMetadata.sha256}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
              {finalVideoOwnerApproved ? (
                <div
                  data-testid="wizard-final-video-owner-approved"
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3"
                >
                  <p className="text-sm font-bold text-emerald-800">
                    현재 최종 영상 Owner 승인 완료
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 break-all">
                    승인 지문{" "}
                    {realMedia?.finalVideo.ownerApprovalFingerprint ??
                      "확인 불가"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    영상·대본·음성·이미지·게시 문구 중 하나라도 바뀌면
                    자동으로 재승인이 필요합니다.
                  </p>
                </div>
              ) : (
                <div
                  data-testid="wizard-final-video-owner-approval"
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 space-y-3"
                >
                  <p className="text-sm font-bold text-amber-900">
                    현재 최종 영상과 게시 문구 승인
                  </p>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={confirmFinalVideosWatched}
                      onChange={(event) =>
                        setConfirmFinalVideosWatched(
                          event.target.checked,
                        )
                      }
                    />
                    <span>
                      모든 편을 소리와 함께 끝까지 재생해 화면·음성·자막을
                      확인했습니다.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={confirmFinalPublishMetadataReviewed}
                      onChange={(event) =>
                        setConfirmFinalPublishMetadataReviewed(
                          event.target.checked,
                        )
                      }
                    />
                    <span>
                      위 Instagram·YouTube 제목·설명·태그를 모두
                      확인했습니다.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={confirmFinalExactFiles}
                      onChange={(event) =>
                        setConfirmFinalExactFiles(event.target.checked)
                      }
                    />
                    <span>
                      표시된 정확한 MP4와 게시 문구 hash 묶음을 게시
                      후보로 승인합니다.
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      data-testid="wizard-final-video-approval-text"
                      value={confirmFinalVideoApprovalText}
                      onChange={(event) =>
                        setConfirmFinalVideoApprovalText(
                          event.target.value,
                        )
                      }
                      placeholder="최종 영상 승인"
                      className="min-w-[220px] rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      data-testid="wizard-action-final-video-review-accept"
                      className={RUN_BTN}
                      disabled={
                        !finalVideoReviewReady ||
                        finalVideoReviewState === "running"
                      }
                      onClick={acceptFinalVideoReview}
                    >
                      현재 최종 영상 승인
                    </button>
                  </div>
                  <ResultNote result={finalVideoReviewResult} />
                </div>
              )}
            </div>
          ) : null}
          <ResultNote result={previewResult} />
          {previewVideo?.exists ? (
            <div className="mt-3">
              <p className="text-sm text-amber-700 font-semibold mb-1.5">시안 영상 (색상 카드) — 업로드 불가</p>
              <video
                key={previewKey}
                controls
                playsInline
                preload="metadata"
                className="w-full max-w-[280px] rounded-xl border border-slate-300 bg-black"
                src={`/api/money-shorts/operator?video=muxed&topicId=${encodeURIComponent(selectedTopicId ?? "")}&v=${previewKey}`}
              />
              {previewVideo.topicTitle ? (
                <p className="text-[15px] text-slate-600 mt-1.5">“{previewVideo.topicTitle}” 주제로 만든 시안입니다.</p>
              ) : null}
              <p className="text-xs text-slate-400 mt-1 break-all">{previewVideo.muxedMp4Path}</p>
            </div>
          ) : null}
        </StepCard>

        {/* 10. 게시 전 점검 — media quality gate 통과분(최종 영상)만 점검 가능 */}
        <StepCard
          num={10}
          title="게시 전 점검"
          state={preflightState}
          desc="최종 영상 기준으로 키·중복·파일을 확인만 합니다. 업로드는 하지 않습니다."
        >
          <button
            type="button"
            data-testid="wizard-action-preflight"
            className={RUN_BTN}
            disabled={!runnable || !selectedTopicId || !mediaGateOk}
            onClick={runPreflight}
          >
            게시 전 점검
          </button>
          {!finalVideoOwnerApproved && finalVideoReady ? (
            <p className="mt-2 text-sm font-semibold text-amber-700">
              먼저 모든 최종 MP4와 게시 문구를 확인하고 [현재 최종 영상
              승인]을 완료해 주세요.
            </p>
          ) : !mediaGateOk ? (
            <div className="mt-2 space-y-0.5">
              <p className="text-sm text-amber-700 font-semibold">
                아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.
              </p>
              {(realMedia?.mediaQualityGate.reasons ?? []).map((reason, i) => (
                <p key={i} className="text-sm text-slate-500">
                  · {reason}
                </p>
              ))}
            </div>
          ) : null}
          <ResultNote result={preflightResult} />
        </StepCard>

        {/* 11. 실제 업로드 — media gate + 게시 전 점검 통과 + 명시 확인 후에만 실행 */}
        <StepCard
          num={11}
          title="실제 업로드"
          state={uploadState}
          desc="확인 절차를 마치면 이 영상이 실제 계정에 게시됩니다. 게시 기록이 남아 같은 콘텐츠는 다시 올라가지 않습니다."
        >
          {uploadState === "success" ? null : (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3.5 space-y-3">
              <p className="text-[15px] font-bold text-rose-700">누르면 실제 계정에 게시됩니다.</p>
              {publishRecoveryRequired ? (
                <div
                  data-testid="wizard-publish-recovery-upload-block"
                  className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5"
                >
                  <p className="text-sm font-bold text-amber-800">
                    기존 게시 결과를 수동 확인해야 하므로 일반 인스타그램·유튜브 업로드를 막았습니다.
                  </p>
                  <PublishRecoveryEvidence
                    topicId={selectedTopicId ?? ""}
                    states={selectedPublishRecoveryStates}
                    disabled={!runnable}
                    onResolved={async () => {
                      await Promise.all([
                        refreshUploadReadyList(),
                        selectedTopicId
                          ? refreshAutomationPlan(selectedTopicId)
                          : Promise.resolve(),
                      ]);
                    }}
                  />
                </div>
              ) : !mediaGateOk ? (
                <p className="text-sm text-slate-500">
                  아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.
                </p>
              ) : !preflightDone ? (
                <p className="text-sm text-slate-500">먼저 [게시 전 점검]을 통과해야 업로드할 수 있습니다.</p>
              ) : null}
              <label className="flex items-start gap-2.5 text-[15px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="wizard-confirm-discovery"
                  className="mt-1 accent-rose-600 scale-125"
                  checked={confirmDiscoveryReady}
                  onChange={(e) => setConfirmDiscoveryReady(e.target.checked)}
                  disabled={!preflightDone || uploadState === "running"}
                />
                플랫폼별 제목·설명·핵심 태그와 인스타그램 추천 자격(Account Status)을 확인했습니다.
              </label>
              <label className="flex items-start gap-2.5 text-[15px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="wizard-confirm-reviewed"
                  className="mt-1 accent-rose-600 scale-125"
                  checked={confirmReviewed}
                  onChange={(e) => setConfirmReviewed(e.target.checked)}
                  disabled={!preflightDone || uploadState === "running"}
                />
                미리보기에서 최종 영상과 제목·설명을 검토했습니다.
              </label>
              <label className="flex items-start gap-2.5 text-[15px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="wizard-confirm-publish"
                  className="mt-1 accent-rose-600 scale-125"
                  checked={confirmPublish}
                  onChange={(e) => setConfirmPublish(e.target.checked)}
                  disabled={!preflightDone || uploadState === "running"}
                />
                실제 인스타그램·유튜브 계정에 게시하는 것에 동의합니다.
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                <input
                  type="text"
                  data-testid="wizard-confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="업로드 라고 입력"
                  disabled={!preflightDone || uploadState === "running"}
                  className="w-44 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 disabled:opacity-40"
                />
                <button
                  type="button"
                  data-testid="wizard-action-upload"
                  disabled={!uploadEnabled}
                  onClick={runActualUpload}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-[15px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  인스타그램·유튜브에 업로드
                </button>
              </div>
              <p className="text-sm text-slate-500">
                확인 3개 체크 + “업로드” 입력까지 마쳐야 버튼이 켜집니다. 서버도 같은 조건을 다시 검사합니다.
              </p>
            </div>
          )}
          {uploadState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">
              업로드 중입니다… 창을 닫지 마세요. (최대 몇 분)
            </p>
          ) : null}
          <ResultNote result={uploadResult} />
        </StepCard>
      </div>
    </section>
  );
}
