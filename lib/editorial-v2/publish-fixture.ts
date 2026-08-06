import type {
  ApprovedRenderIntegrationSessionSnapshot,
  PublishExpectedDestinationIdentity,
  PublishObservedDestinationIdentity,
  PublishPackage,
  PublishScheduleIntent,
  SessionPublicationLedger,
} from "./contracts";
import { buildPlatformPublishMetadata } from "./publish-metadata";
import { buildPublishPackage } from "./publish-package";

export interface SyntheticPublishFixture {
  readonly fixtureVersion: "slice7-synthetic-publish-fixture-v1";
  readonly approvedRenderIntegration: ApprovedRenderIntegrationSessionSnapshot;
  readonly expectedDestinations: readonly PublishExpectedDestinationIdentity[];
  readonly observedDestinations: readonly PublishObservedDestinationIdentity[];
  readonly immediateIntent: PublishScheduleIntent;
  readonly scheduledIntent: PublishScheduleIntent;
  readonly publishPackage: PublishPackage;
  readonly emptyLedger: SessionPublicationLedger;
  readonly syntheticOnly: true;
  readonly actualUserDataIncluded: false;
  readonly actualAccountIdIncluded: false;
  readonly actualPublicationExecuted: false;
}

export function buildSyntheticApprovedRenderIntegrationSnapshot(): ApprovedRenderIntegrationSessionSnapshot {
  const fixedTimestamp = "2026-08-06T00:00:00.000Z";
  const sourceDetailedScriptSnapshot = {
    approvedScript: {
      schemaVersion: "synthetic-detailed-script-v1",
      selectedAngleId: "synthetic-angle-01",
      title: "생활비 신호를 읽는 세 가지 확인점",
      audience: "synthetic-audience",
      durationSeconds: 45 as const,
      thesis: "한 숫자보다 출처와 변화 방향을 함께 확인합니다.",
      beats: [{
        beatId: "synthetic-beat-01",
        beatType: "practical_check_or_action" as const,
        purpose: "synthetic-only",
        narration: "공식 출처와 기준일을 먼저 확인하세요.",
        keyCaption: "출처와 기준일 확인",
        claimRefs: ["synthetic-claim-01"],
        sourceRefs: ["synthetic-source-01"],
        numberRefs: [],
        retentionDevice: "synthetic-checklist",
      }],
      closingAction: "판단 전 원문과 기준일을 다시 확인하세요.",
      nextSignal: "다음 공식 업데이트를 확인합니다.",
      financialSafetyNote: "정보 제공용이며 매수·매도 지시가 아닙니다.",
    },
    evidencePack: {
      verificationLevel: "structural_only" as const,
      provenance: {
        rawHash: "synthetic-raw-hash",
        normalizedHash: "synthetic-normalized-hash",
        researchCutoffDate: "2026-08-06",
        researchWindow: "7d" as const,
        domain: "synthetic-finance-education",
        audience: "synthetic-audience",
        targetDurationSeconds: 45 as const,
        sourceImportSchemaVersion: "synthetic-source-v1",
      },
      sources: [{
        sourceId: "synthetic-source-01",
        publisher: "Synthetic Official Publisher",
        title: "Synthetic Source Metadata",
        url: "source://synthetic-official-source-01",
        publishedAt: "2026-08-05",
        eventDate: null,
        freshness: "fresh" as const,
        originalIndex: 0,
      }],
      claims: [{
        claimId: "synthetic-claim-01",
        signalId: "synthetic-signal-01",
        headline: "Synthetic evidence headline",
        claim: "공식 출처와 기준일을 함께 확인한다.",
        whyNow: "synthetic dry-run",
        audienceImpact: "planning-only",
        sourceRefs: ["synthetic-source-01"],
        numberRefs: [],
      }],
      numbers: [],
      coverage: {
        sourceCount: 1,
        signalCount: 1,
        numberCount: 0,
        freshSourceCount: 1,
        signalCoverage: [{ signalId: "synthetic-signal-01", sourceCount: 1, numberCount: 0, freshSourceCount: 1 }],
        warnings: [],
      },
    },
    selectedAngle: {
      selectedAngleId: "synthetic-angle-01",
      candidateId: "synthetic-candidate-01",
      sourceSignalId: "synthetic-signal-01",
      workingTitle: "Synthetic planning angle",
      hookPromise: "숫자를 보기 전에 출처부터 확인합니다.",
      angleStatement: "source-first synthetic planning",
      viewerQuestion: "어떤 출처와 기준일을 확인해야 할까요?",
      sourceRefs: ["synthetic-source-01"],
      claimRefs: ["synthetic-claim-01"],
      numberRefs: [],
    },
    scriptRawHash: "synthetic-script-raw-hash",
    scriptNormalizedHash: "synthetic-script-normalized-hash",
    evidenceIdentity: "synthetic-evidence-identity",
    validation: { valid: true, issues: [], validatedAt: fixedTimestamp, blockingIssueCount: 0, warningCount: 0 },
    approvalState: "approved" as const,
    audience: "synthetic-audience",
    durationSeconds: 45 as const,
  };
  const sourceCharacterSnapshot = {
    selectedDirectionId: "loop_signal_navigator" as const,
    temporaryDisplayName: "Synthetic Navigator",
    rigVersion: "character-rig-v1" as const,
    motionVocabularyVersion: "character-motion-v1" as const,
    comparisonSceneId: "synthetic-scene-01",
    sceneMotionAssignments: [],
    reducedMotionAssignments: [],
    originalityReview: [],
    rightsReview: { sourceStatus: "OWNED_ORIGINAL" as const, provenance: "internal_svg_primitives_only" as const, externalAssetsUsed: false as const, thirdPartyMarksUsed: false as const, realPersonLikenessUsed: false as const, blockingIssueCount: 0 },
    accessibilityReview: { reducedMotionCompared: true, rapidFlashingAbsent: true, statusNotColorOnly: true, evidenceRemainsReadable: true, blockingIssueCount: 0 },
    provisionalApprovalState: "provisionally_approved" as const,
    sourcePlanningIdentity: "synthetic-planning-identity",
    sessionOnly: true as const,
    finalIdentityApproved: false as const,
    productionAssetCreated: false as const,
  };
  const voicePlan = {
    planVersion: "voice-request-plan-v1" as const,
    sourceScriptHash: "synthetic-script-normalized-hash",
    mode: "plan_only" as const,
    provider: null,
    scenes: [{ sceneId: "synthetic-scene-01", sceneOrder: 1, narration: "공식 출처와 기준일을 먼저 확인하세요.", characterCount: 23, wordCount: 4, estimatedDurationSeconds: 4, locale: "ko-KR", voiceIdentity: "synthetic-voice", sourceScriptHash: "synthetic-script-normalized-hash", executionRequested: false as const, executed: false as const, audioCreated: false as const }],
    usage: { totalCharacters: 23, totalWords: 4, totalEstimatedDurationSeconds: 4, targetDurationSeconds: 45, durationVarianceSeconds: -41 },
    costEstimateClass: "unknown" as const,
    manualCostBasisLabel: null,
    externalProviderRequired: false,
    requiresOwnerApproval: false,
    ownerApprovalConfirmed: false,
    actualRequestExecuted: false as const,
    audioCreated: false as const,
    productionReady: false as const,
  };
  const cue = { cueId: "synthetic-cue-01", sceneId: "synthetic-scene-01", sceneOrder: 1, cueOrder: 1, text: "출처와 기준일 확인", startSeconds: 0, endSeconds: 4, keyCaption: true, safeZone: "lower_safe_caption_zone" as const, alignmentStatus: "estimated_not_audio_aligned" as const };
  const subtitleTrack = {
    trackVersion: "subtitle-track-plan-v1" as const,
    sourceScriptHash: "synthetic-script-normalized-hash",
    locale: "ko-KR",
    targetDurationSeconds: 45,
    scenePlans: [{ sceneId: "synthetic-scene-01", sceneOrder: 1, narration: "공식 출처와 기준일을 먼저 확인하세요.", keyCaption: "출처와 기준일 확인", startSeconds: 0, endSeconds: 4, cues: [cue], alignmentStatus: "estimated_not_audio_aligned" as const }],
    cues: [cue],
    safeZone: "lower_safe_caption_zone" as const,
    alignmentStatus: "estimated_not_audio_aligned" as const,
    audioAlignmentPerformed: false as const,
    productionReady: false as const,
  };
  const renderScene = {
    sceneId: "synthetic-scene-01",
    sceneOrder: 1,
    enabled: true,
    durationSeconds: 4,
    primaryVisualStrategy: "official_source_card" as const,
    acquisitionMode: "deterministic_overlay" as const,
    narration: "공식 출처와 기준일을 먼저 확인하세요.",
    keyCaption: "출처와 기준일 확인",
    sourceRefs: ["synthetic-source-01"],
    numberRefs: [],
    layers: [],
    characterAssignment: null,
    subtitleCueIds: ["synthetic-cue-01"],
    unresolvedRequirements: [],
    characterOccupancyPercent: 0,
    characterOccupancyTargetPercent: 14,
    characterOverlapsSubtitleSafeZone: false,
    characterIntrudesPrimarySafeZone: false,
    obstructionPolicySatisfied: true,
    characterIsPrimaryVisual: false,
    captionDensityClass: "normal" as const,
    evidenceDensityClass: "normal" as const,
    structuralSafeAreaPrecheck: "STRUCTURAL_SAFE_AREA_PRECHECK" as const,
    fingerprint: { sceneId: "synthetic-scene-01", fingerprintVersion: "scene-render-fingerprint-v1" as const, fingerprint: "synthetic-scene-fingerprint", sceneContentHash: "synthetic-content-hash", voiceHash: "synthetic-voice-hash", subtitleHash: "synthetic-subtitle-hash", characterHash: "synthetic-character-hash", profileHash: "synthetic-profile-hash" },
  };
  const renderManifest = {
    manifestVersion: "render-manifest-v1" as const,
    sourcePlanningIdentity: "synthetic-planning-identity",
    sourceScriptHash: "synthetic-script-normalized-hash",
    selectedAngleId: "synthetic-angle-01",
    selectedCharacterDirectionId: "loop_signal_navigator" as const,
    profile: { profileId: "final_1080x1920" as const, label: "Synthetic final profile metadata only", width: 1080 as const, height: 1920 as const, framesPerSecond: 30 as const, bitrateIntent: "production_intent_unverified" as const, encodingIntent: "production_quality_intent" as const, preview: false, final: true, executionAllowed: false, productionReady: false as const },
    voicePlan,
    subtitleTrack,
    scenes: [renderScene],
    enabledSceneCount: 1,
    totalDurationSeconds: 4,
    globalSafeAreaPolicy: "evidence_first_no_obstruction" as const,
    integrationReadiness: "INTEGRATION_PRECHECK_ONLY" as const,
    manifestHash: "synthetic-render-manifest-hash-v1",
    renderExecuted: false as const,
    audioCreated: false as const,
    externalRequestsMade: false as const,
    productionReady: false as const,
  };
  return {
    sourceDetailedScriptSnapshot,
    sourceCharacterSnapshot,
    voicePlan,
    subtitleTrack,
    renderManifest,
    validation: { valid: true, blockingIssueCount: 0, warningCount: 1, verificationLevel: "INTEGRATION_PRECHECK_ONLY", issues: [{ code: "synthetic_fixture_only", sceneId: null, fieldPath: "fixture", message: "Synthetic fixture only", blocking: false }] },
    bridgePlan: { bridgeVersion: "renderer-bridge-plan-v1", manifestHash: renderManifest.manifestHash, profileId: "final_1080x1920", capabilities: [], sceneLogicalUris: ["asset://synthetic-scene-01"], missingRequirements: ["production_render_adapter_not_implemented"], executionReady: false, networkRequired: false, filesystemAccessDeclared: false, processExecutionDeclared: false, v1ImportsUsed: false },
    approvalState: "approved",
    sessionOnly: true,
    ttsConnected: false,
    audioCreated: false,
    renderExecuted: false,
    productionReady: false,
  };
}

export function buildSyntheticPublishFixture(): SyntheticPublishFixture {
  const approvedRenderIntegration = buildSyntheticApprovedRenderIntegrationSnapshot();
  const expectedDestinations: readonly PublishExpectedDestinationIdentity[] = [
    { platformId: "instagram_reels", stableDestinationId: "synthetic-instagram-destination", displayLabel: "Synthetic Instagram", ownerConfirmation: true, identityPolicyVersion: "publish-identity-policy-v1" },
    { platformId: "youtube_shorts", stableDestinationId: "synthetic-youtube-destination", displayLabel: "Synthetic YouTube", ownerConfirmation: true, identityPolicyVersion: "publish-identity-policy-v1" },
  ];
  const observedDestinations: readonly PublishObservedDestinationIdentity[] = [
    { platformId: "instagram_reels", stableDestinationId: "synthetic-instagram-destination", displayLabel: "Synthetic Instagram observed", observationLevel: "manual_unverified", observedBy: "synthetic-owner-input", observedAtIso: "2026-08-06T00:00:00.000Z", sourceDescription: "synthetic session-only manual observation" },
    { platformId: "youtube_shorts", stableDestinationId: "synthetic-youtube-destination", displayLabel: "Synthetic YouTube observed", observationLevel: "manual_unverified", observedBy: "synthetic-owner-input", observedAtIso: "2026-08-06T00:00:00.000Z", sourceDescription: "synthetic session-only manual observation" },
  ];
  const immediateIntent: PublishScheduleIntent = { executionIntent: "immediate_future", scheduledAtIso: null, timezone: null, validationNowIso: "2026-08-06T00:00:00.000Z", scheduleOwnerConfirmation: false, schedulerCapabilityRequired: false, schedulerAvailable: false, executionReady: false };
  const scheduledIntent: PublishScheduleIntent = { executionIntent: "scheduled_future", scheduledAtIso: "2026-08-07T09:00:00.000Z", timezone: "Asia/Seoul", validationNowIso: "2026-08-06T00:00:00.000Z", scheduleOwnerConfirmation: true, schedulerCapabilityRequired: true, schedulerAvailable: false, executionReady: false };
  const instagramMetadata = buildPlatformPublishMetadata({ approvedRenderIntegration, platformId: "instagram_reels", hashtags: ["#출처확인", "#기준일", "#출처확인"], selectedCoverSceneId: "synthetic-scene-01", coverTitleOverlay: "출처와 기준일", accessibilityDescription: "공식 출처 확인 절차를 보여주는 synthetic 카드", visibilityIntent: "public" });
  const youtubeMetadata = buildPlatformPublishMetadata({ approvedRenderIntegration, platformId: "youtube_shorts", hashtags: ["#출처확인", "#생활비신호"], selectedCoverSceneId: "synthetic-scene-01", coverTitleOverlay: "출처부터 확인", accessibilityDescription: "공식 출처 확인 절차를 보여주는 synthetic 카드", visibilityIntent: "private" });
  const publishPackage = buildPublishPackage({ approvedRenderIntegration, selectedPlatforms: ["instagram_reels", "youtube_shorts"], expectedDestinationIdentities: expectedDestinations, observedDestinationIdentities: observedDestinations, platformMetadata: [instagramMetadata, youtubeMetadata], scheduleIntent: immediateIntent, rightsResolvedForPlanning: true, paidPossible: false, paidPossibleOwnerConfirmation: false, createdFromSessionIdentity: "slice7-synthetic-session" });
  const emptyLedger: SessionPublicationLedger = { ledgerVersion: "session-publication-ledger-v1", sessionIdentity: "slice7-synthetic-session", attempts: [], platformStates: [], durable: false, remoteSynchronized: false };
  return { fixtureVersion: "slice7-synthetic-publish-fixture-v1", approvedRenderIntegration, expectedDestinations: expectedDestinations.map((entry) => ({ ...entry })), observedDestinations: observedDestinations.map((entry) => ({ ...entry })), immediateIntent: { ...immediateIntent }, scheduledIntent: { ...scheduledIntent }, publishPackage, emptyLedger, syntheticOnly: true, actualUserDataIncluded: false, actualAccountIdIncluded: false, actualPublicationExecuted: false };
}
