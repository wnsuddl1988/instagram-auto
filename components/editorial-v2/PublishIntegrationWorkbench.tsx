"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ApprovedPublishIntegrationSessionSnapshot,
  ApprovedRenderIntegrationSessionSnapshot,
  PublicationAttemptRecord,
  PublishExecutionIntent,
  PublishPlatformId,
  PublishVisibilityIntent,
  SessionPublicationLedger,
} from "../../lib/editorial-v2/contracts";
import type { PublishIntegrationDraftState } from "../../lib/editorial-v2/draft-contracts";
import { buildPublishBridgePlan, validatePublishBridgePlan } from "../../lib/editorial-v2/publish-bridge";
import { cloneSessionPublicationLedger, recordSessionPublicationAttempt } from "../../lib/editorial-v2/publish-ledger-session";
import { buildPlatformPublishMetadata } from "../../lib/editorial-v2/publish-metadata";
import { buildPublishPackage, clonePublishPackage, hashPublishPackage } from "../../lib/editorial-v2/publish-package";
import { buildFailedPlatformRetryPackage, buildPublishRecoveryPlan } from "../../lib/editorial-v2/publish-recovery";
import { canApprovePublishIntegration, summarizePublishValidation, validatePublishIntegration } from "../../lib/editorial-v2/publish-validation";
import { cloneRenderManifest } from "../../lib/editorial-v2/render-manifest";
import styles from "./PublishIntegrationWorkbench.module.css";

interface PublishIntegrationWorkbenchProps {
  readonly approvedRenderIntegrationSnapshot: ApprovedRenderIntegrationSessionSnapshot;
  readonly onApprovedPublishIntegrationChange?: (
    snapshot: ApprovedPublishIntegrationSessionSnapshot | null,
  ) => void;
  readonly initialDraftState?: PublishIntegrationDraftState | null;
  readonly draftHydrationKey?: string;
  readonly onDraftStateChange?: (state: PublishIntegrationDraftState) => void;
}

const PLATFORMS: readonly PublishPlatformId[] = ["instagram_reels", "youtube_shorts"];

function createEmptyLedger(sessionIdentity: string): SessionPublicationLedger {
  return { ledgerVersion: "session-publication-ledger-v1", sessionIdentity, attempts: [], platformStates: [], durable: false, remoteSynchronized: false };
}

function platformLabel(platformId: PublishPlatformId): string {
  return platformId === "instagram_reels" ? "Instagram Reels" : "YouTube Shorts";
}

function cloneApprovedRenderIntegrationSnapshot(
  snapshot: ApprovedRenderIntegrationSessionSnapshot,
): ApprovedRenderIntegrationSessionSnapshot {
  return {
    ...snapshot,
    sourceDetailedScriptSnapshot: {
      ...snapshot.sourceDetailedScriptSnapshot,
      approvedScript: {
        ...snapshot.sourceDetailedScriptSnapshot.approvedScript,
        beats: snapshot.sourceDetailedScriptSnapshot.approvedScript.beats.map((beat) => ({
          ...beat,
          claimRefs: [...beat.claimRefs],
          sourceRefs: [...beat.sourceRefs],
          numberRefs: [...beat.numberRefs],
        })),
      },
      evidencePack: {
        ...snapshot.sourceDetailedScriptSnapshot.evidencePack,
        provenance: { ...snapshot.sourceDetailedScriptSnapshot.evidencePack.provenance },
        sources: snapshot.sourceDetailedScriptSnapshot.evidencePack.sources.map((source) => ({ ...source })),
        claims: snapshot.sourceDetailedScriptSnapshot.evidencePack.claims.map((claim) => ({ ...claim, sourceRefs: [...claim.sourceRefs], numberRefs: [...claim.numberRefs] })),
        numbers: snapshot.sourceDetailedScriptSnapshot.evidencePack.numbers.map((number) => ({ ...number, sourceRefs: [...number.sourceRefs] })),
        coverage: {
          ...snapshot.sourceDetailedScriptSnapshot.evidencePack.coverage,
          signalCoverage: snapshot.sourceDetailedScriptSnapshot.evidencePack.coverage.signalCoverage.map((coverage) => ({ ...coverage })),
          warnings: [...snapshot.sourceDetailedScriptSnapshot.evidencePack.coverage.warnings],
        },
      },
      selectedAngle: {
        ...snapshot.sourceDetailedScriptSnapshot.selectedAngle,
        sourceRefs: [...snapshot.sourceDetailedScriptSnapshot.selectedAngle.sourceRefs],
        claimRefs: [...snapshot.sourceDetailedScriptSnapshot.selectedAngle.claimRefs],
        numberRefs: [...snapshot.sourceDetailedScriptSnapshot.selectedAngle.numberRefs],
      },
      validation: {
        ...snapshot.sourceDetailedScriptSnapshot.validation,
        issues: snapshot.sourceDetailedScriptSnapshot.validation.issues.map((issue) => ({ ...issue })),
      },
    },
    sourceCharacterSnapshot: {
      ...snapshot.sourceCharacterSnapshot,
      sceneMotionAssignments: snapshot.sourceCharacterSnapshot.sceneMotionAssignments.map((assignment) => ({ ...assignment, evidenceRefs: [...assignment.evidenceRefs], sourceRefs: [...assignment.sourceRefs], numberRefs: [...assignment.numberRefs] })),
      reducedMotionAssignments: snapshot.sourceCharacterSnapshot.reducedMotionAssignments.map((assignment) => ({ ...assignment, evidenceRefs: [...assignment.evidenceRefs], sourceRefs: [...assignment.sourceRefs], numberRefs: [...assignment.numberRefs] })),
      originalityReview: snapshot.sourceCharacterSnapshot.originalityReview.map((check) => ({ ...check })),
      rightsReview: { ...snapshot.sourceCharacterSnapshot.rightsReview },
      accessibilityReview: { ...snapshot.sourceCharacterSnapshot.accessibilityReview },
    },
    voicePlan: { ...snapshot.voicePlan, provider: snapshot.voicePlan.provider ? { ...snapshot.voicePlan.provider } : null, scenes: snapshot.voicePlan.scenes.map((scene) => ({ ...scene })), usage: { ...snapshot.voicePlan.usage } },
    subtitleTrack: { ...snapshot.subtitleTrack, scenePlans: snapshot.subtitleTrack.scenePlans.map((scene) => ({ ...scene, cues: scene.cues.map((cue) => ({ ...cue })) })), cues: snapshot.subtitleTrack.cues.map((cue) => ({ ...cue })) },
    renderManifest: cloneRenderManifest(snapshot.renderManifest),
    validation: { ...snapshot.validation, issues: snapshot.validation.issues.map((issue) => ({ ...issue })) },
    bridgePlan: { ...snapshot.bridgePlan, capabilities: snapshot.bridgePlan.capabilities.map((capability) => ({ ...capability })), sceneLogicalUris: [...snapshot.bridgePlan.sceneLogicalUris], missingRequirements: [...snapshot.bridgePlan.missingRequirements] },
  };
}

export default function PublishIntegrationWorkbench({
  approvedRenderIntegrationSnapshot,
  onApprovedPublishIntegrationChange,
  initialDraftState = null,
  draftHydrationKey = "no-draft",
  onDraftStateChange,
}: PublishIntegrationWorkbenchProps) {
  const manifest = approvedRenderIntegrationSnapshot.renderManifest;
  const firstSceneId = manifest.scenes[0]?.sceneId ?? "";
  const sessionIdentity = `publish-session:${manifest.manifestHash}`;
  const [selectedPlatforms, setSelectedPlatforms] = useState<readonly PublishPlatformId[]>(initialDraftState?.selectedPlatforms ?? PLATFORMS);
  const [instagramExpectedId, setInstagramExpectedId] = useState(initialDraftState?.instagramExpectedId ?? "");
  const [instagramObservedId, setInstagramObservedId] = useState(initialDraftState?.instagramObservedId ?? "");
  const [instagramLabel, setInstagramLabel] = useState(initialDraftState?.instagramLabel ?? "");
  const [instagramOwnerConfirmed, setInstagramOwnerConfirmed] = useState(initialDraftState?.instagramOwnerConfirmed ?? false);
  const [youtubeExpectedId, setYoutubeExpectedId] = useState(initialDraftState?.youtubeExpectedId ?? "");
  const [youtubeObservedId, setYoutubeObservedId] = useState(initialDraftState?.youtubeObservedId ?? "");
  const [youtubeLabel, setYoutubeLabel] = useState(initialDraftState?.youtubeLabel ?? "");
  const [youtubeOwnerConfirmed, setYoutubeOwnerConfirmed] = useState(initialDraftState?.youtubeOwnerConfirmed ?? false);
  const [instagramHashtags, setInstagramHashtags] = useState(initialDraftState?.instagramHashtags ?? "출처확인,기준일");
  const [youtubeHashtags, setYoutubeHashtags] = useState(initialDraftState?.youtubeHashtags ?? "출처확인,생활비신호");
  const [instagramCoverSceneId, setInstagramCoverSceneId] = useState(initialDraftState?.instagramCoverSceneId ?? firstSceneId);
  const [youtubeCoverSceneId, setYoutubeCoverSceneId] = useState(initialDraftState?.youtubeCoverSceneId ?? firstSceneId);
  const [youtubeVisibility, setYoutubeVisibility] = useState<PublishVisibilityIntent>(initialDraftState?.youtubeVisibility ?? "private");
  const [executionIntent, setExecutionIntent] = useState<PublishExecutionIntent>(initialDraftState?.executionIntent ?? "immediate_future");
  const [scheduledAtIso, setScheduledAtIso] = useState(initialDraftState?.scheduledAtIso ?? "");
  const [timezone, setTimezone] = useState(initialDraftState?.timezone ?? "Asia/Seoul");
  const [validationNowIso, setValidationNowIso] = useState(initialDraftState?.validationNowIso ?? "2026-08-06T00:00:00.000Z");
  const [scheduleOwnerConfirmation, setScheduleOwnerConfirmation] = useState(initialDraftState?.scheduleOwnerConfirmation ?? false);
  const [ledger, setLedger] = useState<SessionPublicationLedger>(() => initialDraftState?.ledger.sessionIdentity === sessionIdentity ? cloneSessionPublicationLedger(initialDraftState.ledger) : createEmptyLedger(sessionIdentity));
  const [actualPublishNotIncludedConfirmed, setActualPublishNotIncludedConfirmed] = useState(initialDraftState?.actualPublishNotIncludedConfirmed ?? false);
  const [approvedPackageHash, setApprovedPackageHash] = useState<string | null>(null);

  const expectedDestinations = useMemo(() => [
    { platformId: "instagram_reels" as const, stableDestinationId: instagramExpectedId, displayLabel: instagramLabel, ownerConfirmation: instagramOwnerConfirmed, identityPolicyVersion: "publish-identity-policy-v1" as const },
    { platformId: "youtube_shorts" as const, stableDestinationId: youtubeExpectedId, displayLabel: youtubeLabel, ownerConfirmation: youtubeOwnerConfirmed, identityPolicyVersion: "publish-identity-policy-v1" as const },
  ], [instagramExpectedId, instagramLabel, instagramOwnerConfirmed, youtubeExpectedId, youtubeLabel, youtubeOwnerConfirmed]);
  const observedDestinations = useMemo(() => [
    { platformId: "instagram_reels" as const, stableDestinationId: instagramObservedId, displayLabel: instagramLabel, observationLevel: "manual_unverified" as const, observedBy: "owner_session_input", observedAtIso: validationNowIso, sourceDescription: "session-only manual planning evidence" },
    { platformId: "youtube_shorts" as const, stableDestinationId: youtubeObservedId, displayLabel: youtubeLabel, observationLevel: "manual_unverified" as const, observedBy: "owner_session_input", observedAtIso: validationNowIso, sourceDescription: "session-only manual planning evidence" },
  ], [instagramLabel, instagramObservedId, validationNowIso, youtubeLabel, youtubeObservedId]);
  const metadata = useMemo(() => [
    buildPlatformPublishMetadata({ approvedRenderIntegration: approvedRenderIntegrationSnapshot, platformId: "instagram_reels", hashtags: instagramHashtags.split(","), selectedCoverSceneId: instagramCoverSceneId, coverTitleOverlay: approvedRenderIntegrationSnapshot.sourceDetailedScriptSnapshot.approvedScript.title, accessibilityDescription: "출처와 기준일을 설명하는 세로형 정보 카드", visibilityIntent: "public" }),
    buildPlatformPublishMetadata({ approvedRenderIntegration: approvedRenderIntegrationSnapshot, platformId: "youtube_shorts", hashtags: youtubeHashtags.split(","), selectedCoverSceneId: youtubeCoverSceneId, coverTitleOverlay: approvedRenderIntegrationSnapshot.sourceDetailedScriptSnapshot.approvedScript.title, accessibilityDescription: "출처와 기준일을 설명하는 세로형 정보 카드", visibilityIntent: youtubeVisibility }),
  ], [approvedRenderIntegrationSnapshot, instagramCoverSceneId, instagramHashtags, youtubeCoverSceneId, youtubeHashtags, youtubeVisibility]);
  const scheduleIntent = useMemo(() => ({
    executionIntent,
    scheduledAtIso: executionIntent === "scheduled_future" ? scheduledAtIso || null : null,
    timezone: executionIntent === "scheduled_future" ? timezone || null : null,
    validationNowIso,
    scheduleOwnerConfirmation: executionIntent === "scheduled_future" && scheduleOwnerConfirmation,
    schedulerCapabilityRequired: executionIntent === "scheduled_future",
    schedulerAvailable: false as const,
    executionReady: false as const,
  }), [executionIntent, scheduleOwnerConfirmation, scheduledAtIso, timezone, validationNowIso]);
  const rightsResolvedForPlanning = approvedRenderIntegrationSnapshot.sourceCharacterSnapshot.rightsReview.blockingIssueCount === 0
    && approvedRenderIntegrationSnapshot.validation.blockingIssueCount === 0;
  const paidPossible = approvedRenderIntegrationSnapshot.voicePlan.externalProviderRequired;
  const paidPossibleOwnerConfirmation = !paidPossible || approvedRenderIntegrationSnapshot.voicePlan.ownerApprovalConfirmed;
  const publishPackage = useMemo(() => buildPublishPackage({
    approvedRenderIntegration: approvedRenderIntegrationSnapshot,
    selectedPlatforms,
    expectedDestinationIdentities: expectedDestinations,
    observedDestinationIdentities: observedDestinations,
    platformMetadata: metadata,
    scheduleIntent,
    rightsResolvedForPlanning,
    paidPossible,
    paidPossibleOwnerConfirmation,
    createdFromSessionIdentity: sessionIdentity,
  }), [approvedRenderIntegrationSnapshot, expectedDestinations, metadata, observedDestinations, paidPossible, paidPossibleOwnerConfirmation, rightsResolvedForPlanning, scheduleIntent, selectedPlatforms, sessionIdentity]);
  const recoveryPlan = useMemo(() => buildPublishRecoveryPlan(publishPackage, ledger), [ledger, publishPackage]);
  const bridgePlan = useMemo(() => buildPublishBridgePlan(publishPackage, recoveryPlan), [publishPackage, recoveryPlan]);
  const validation = useMemo(() => summarizePublishValidation([
    ...validatePublishIntegration(publishPackage, { approvedRenderIntegration: approvedRenderIntegrationSnapshot, ledger, rightsResolvedForPlanning, paidPossibleOwnerConfirmation }),
    ...validatePublishBridgePlan(bridgePlan, publishPackage),
  ]), [approvedRenderIntegrationSnapshot, bridgePlan, ledger, paidPossibleOwnerConfirmation, publishPackage, rightsResolvedForPlanning]);
  const currentPackageHash = useMemo(() => hashPublishPackage(publishPackage), [publishPackage]);
  const approvalState = approvedPackageHash === currentPackageHash ? "approved" : approvedPackageHash ? "invalidated" : "not_approved";
  const approvable = actualPublishNotIncludedConfirmed && canApprovePublishIntegration(validation) && bridgePlan.executionReady === false;

  useEffect(() => {
    if (!onApprovedPublishIntegrationChange) return;
    if (approvalState !== "approved" || !approvable) {
      onApprovedPublishIntegrationChange(null);
      return;
    }
    onApprovedPublishIntegrationChange({
      publishPackage: clonePublishPackage(publishPackage),
      validation: { ...validation, issues: validation.issues.map((entry) => ({ ...entry })) },
      bridgePlan: { ...bridgePlan, platformPlans: bridgePlan.platformPlans.map((entry) => ({ ...entry, scheduleIntent: { ...entry.scheduleIntent }, requiredCapabilities: entry.requiredCapabilities.map((capability) => ({ ...capability })), unavailableCapabilities: [...entry.unavailableCapabilities] })) },
      ledger: cloneSessionPublicationLedger(ledger),
      recoveryPlan: { ...recoveryPlan, successfulPlatformIds: [...recoveryPlan.successfulPlatformIds], failedPlatformIds: [...recoveryPlan.failedPlatformIds], retryablePlatformIds: [...recoveryPlan.retryablePlatformIds], blockedPlatformIds: [...recoveryPlan.blockedPlatformIds], unchangedSuccessfulAttemptIds: [...recoveryPlan.unchangedSuccessfulAttemptIds], requiredPlanChanges: [...recoveryPlan.requiredPlanChanges], globalBlockingReasons: [...recoveryPlan.globalBlockingReasons], nextAllowedActions: recoveryPlan.nextAllowedActions.map((entry) => ({ ...entry, reasons: [...entry.reasons], attemptIds: [...entry.attemptIds] })) },
      approvalState: "approved",
      sessionOnly: true,
      externalIdentityVerified: false,
      uploadExecuted: false,
      publicationExecuted: false,
      schedulingExecuted: false,
      durableLedgerAvailable: false,
      executionReady: false,
      sourceRenderIntegrationSnapshot: cloneApprovedRenderIntegrationSnapshot(approvedRenderIntegrationSnapshot),
      sourceRenderIntegrationIdentity: `${approvedRenderIntegrationSnapshot.renderManifest.sourcePlanningIdentity}:${approvedRenderIntegrationSnapshot.renderManifest.manifestHash}`,
      sceneFingerprints: approvedRenderIntegrationSnapshot.renderManifest.scenes.map((scene) => ({ ...scene.fingerprint })),
      selectedCharacterDirectionId: approvedRenderIntegrationSnapshot.sourceCharacterSnapshot.selectedDirectionId,
      platformPackages: publishPackage.platformPackages.map((entry) => ({
        ...entry,
        expectedDestinationIdentity: { ...entry.expectedDestinationIdentity },
        observedDestinationIdentity: { ...entry.observedDestinationIdentity },
        identityComparison: { ...entry.identityComparison, blockingReasons: [...entry.identityComparison.blockingReasons] },
        metadata: { ...entry.metadata, hashtags: { ...entry.metadata.hashtags, rawHashtags: [...entry.metadata.hashtags.rawHashtags], normalizedHashtags: [...entry.metadata.hashtags.normalizedHashtags] }, sourceDisclosure: { ...entry.metadata.sourceDisclosure, sources: entry.metadata.sourceDisclosure.sources.map((source) => ({ ...source })) }, coverPlan: { ...entry.metadata.coverPlan }, policy: { ...entry.metadata.policy } },
        coverPlan: { ...entry.coverPlan },
        dedupeKey: { ...entry.dedupeKey },
        blockingIssues: [...entry.blockingIssues],
        warnings: [...entry.warnings],
      })),
      publishMetadata: publishPackage.platformPackages.map((entry) => ({ ...entry.metadata, hashtags: { ...entry.metadata.hashtags, rawHashtags: [...entry.metadata.hashtags.rawHashtags], normalizedHashtags: [...entry.metadata.hashtags.normalizedHashtags] }, sourceDisclosure: { ...entry.metadata.sourceDisclosure, sources: entry.metadata.sourceDisclosure.sources.map((source) => ({ ...source })) }, coverPlan: { ...entry.metadata.coverPlan }, policy: { ...entry.metadata.policy } })),
      sourceDisclosures: publishPackage.platformPackages.map((entry) => ({ ...entry.metadata.sourceDisclosure, sources: entry.metadata.sourceDisclosure.sources.map((source) => ({ ...source })) })),
      destinationIdentityPlan: publishPackage.platformPackages.map((entry) => ({ ...entry.expectedDestinationIdentity })),
      dedupeKeys: publishPackage.platformPackages.map((entry) => ({ ...entry.dedupeKey })),
    });
    return () => onApprovedPublishIntegrationChange(null);
  }, [approvalState, approvable, approvedRenderIntegrationSnapshot, bridgePlan, ledger, onApprovedPublishIntegrationChange, publishPackage, recoveryPlan, validation]);

  useEffect(() => {
    onDraftStateChange?.({
      stageId: "publish_integration",
      approvalAuthority: "non_canonical_draft",
      approvalLikeState: approvedPackageHash ? "pending_reconfirmation" : "not_approved",
      selectedPlatforms: [...selectedPlatforms],
      instagramExpectedId,
      instagramObservedId,
      instagramLabel,
      instagramOwnerConfirmed,
      youtubeExpectedId,
      youtubeObservedId,
      youtubeLabel,
      youtubeOwnerConfirmed,
      instagramHashtags,
      youtubeHashtags,
      instagramCoverSceneId,
      youtubeCoverSceneId,
      youtubeVisibility,
      executionIntent,
      scheduledAtIso,
      timezone,
      validationNowIso,
      scheduleOwnerConfirmation,
      ledger: cloneSessionPublicationLedger(ledger),
      actualPublishNotIncludedConfirmed,
      approvedPackageHash,
    });
  }, [actualPublishNotIncludedConfirmed, approvedPackageHash, draftHydrationKey, executionIntent, instagramCoverSceneId, instagramExpectedId, instagramHashtags, instagramLabel, instagramObservedId, instagramOwnerConfirmed, ledger, onDraftStateChange, scheduleOwnerConfirmation, scheduledAtIso, selectedPlatforms, timezone, validationNowIso, youtubeCoverSceneId, youtubeExpectedId, youtubeHashtags, youtubeLabel, youtubeObservedId, youtubeOwnerConfirmed, youtubeVisibility]);

  function togglePlatform(platformId: PublishPlatformId): void {
    setSelectedPlatforms((current) => current.includes(platformId) ? current.filter((entry) => entry !== platformId) : [...current, platformId]);
  }

  function runSyntheticPartialFailure(): void {
    const instagram = publishPackage.platformPackages.find((entry) => entry.platformId === "instagram_reels");
    const youtube = publishPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts");
    if (!instagram?.identityComparison.matchesForPlanning || !youtube?.identityComparison.matchesForPlanning || ledger.attempts.length > 0) return;
    const requestedAtIso = Number.isFinite(Date.parse(validationNowIso)) ? validationNowIso : "2026-08-06T00:00:00.000Z";
    const instagramAttempt: PublicationAttemptRecord = { attemptId: `dry-run-instagram-${instagram.dedupeKey.value}`, platformId: "instagram_reels", dedupeKey: instagram.dedupeKey.value, attemptOrdinal: 1, status: "dry_run_success", requestedAtIso, completedAtIso: requestedAtIso, failureCode: null, failureMessage: null, retryable: false, identityMatchAtAttempt: true, externalExecution: false, dryRun: true };
    const youtubeAttempt: PublicationAttemptRecord = { attemptId: `dry-run-youtube-${youtube.dedupeKey.value}`, platformId: "youtube_shorts", dedupeKey: youtube.dedupeKey.value, attemptOrdinal: 1, status: "dry_run_failed", requestedAtIso, completedAtIso: requestedAtIso, failureCode: "SYNTHETIC_RETRYABLE_FAILURE", failureMessage: "Synthetic no-network failure", retryable: true, identityMatchAtAttempt: true, externalExecution: false, dryRun: true };
    setLedger(recordSessionPublicationAttempt(recordSessionPublicationAttempt(ledger, instagramAttempt), youtubeAttempt));
    setApprovedPackageHash(null);
  }

  function runSyntheticFailedPlatformRetry(): void {
    const currentRecovery = buildPublishRecoveryPlan(publishPackage, ledger);
    const retryPackage = buildFailedPlatformRetryPackage(publishPackage, currentRecovery);
    const youtube = retryPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts");
    const failed = ledger.attempts.find((entry) => entry.platformId === "youtube_shorts" && entry.status === "dry_run_failed");
    if (!youtube || !failed) return;
    const retryAttempt: PublicationAttemptRecord = { attemptId: `dry-run-youtube-retry-${youtube.dedupeKey.value}`, platformId: "youtube_shorts", dedupeKey: youtube.dedupeKey.value, attemptOrdinal: failed.attemptOrdinal + 1, status: "dry_run_success", requestedAtIso: failed.requestedAtIso, completedAtIso: failed.requestedAtIso, failureCode: null, failureMessage: null, retryable: false, identityMatchAtAttempt: true, externalExecution: false, dryRun: true };
    setLedger(recordSessionPublicationAttempt(ledger, retryAttempt, true));
    setApprovedPackageHash(null);
  }

  function resetPublishPlanning(): void {
    setSelectedPlatforms(PLATFORMS);
    setInstagramExpectedId("");
    setInstagramObservedId("");
    setInstagramLabel("");
    setInstagramOwnerConfirmed(false);
    setYoutubeExpectedId("");
    setYoutubeObservedId("");
    setYoutubeLabel("");
    setYoutubeOwnerConfirmed(false);
    setExecutionIntent("immediate_future");
    setScheduledAtIso("");
    setTimezone("Asia/Seoul");
    setScheduleOwnerConfirmation(false);
    setLedger(createEmptyLedger(sessionIdentity));
    setActualPublishNotIncludedConfirmed(false);
    setApprovedPackageHash(null);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}><p className={styles.eyebrow}>Shorts Editorial OS V2 · Slice 7</p><h1>Publish Package · Identity · Recovery</h1><p>Session-only 게시 계획입니다. 실제 계정 조회, OAuth, upload, publish, schedule, durable ledger, network는 없습니다.</p></header>

      <section className={styles.step}><h2><span>1</span> 플랫폼 선택</h2><div className={styles.platformGrid}>{PLATFORMS.map((platformId) => <label key={platformId} className={styles.platformCard} data-selected={selectedPlatforms.includes(platformId)}><input type="checkbox" checked={selectedPlatforms.includes(platformId)} onChange={() => togglePlatform(platformId)} /><strong>{platformLabel(platformId)}</strong><small>독립 validation · attempt · recovery</small></label>)}</div></section>

      <section className={styles.step}><h2><span>2</span> 목적지 계정</h2><p className={styles.notice}>manual_unverified planning evidence입니다. 실제 계정 API 조회나 외부 검증 완료가 아니며 mismatch는 hard stop입니다.</p><div className={styles.identityGrid}>
        <article><h3>Instagram Reels</h3><label>Expected stable ID<input value={instagramExpectedId} onChange={(event) => setInstagramExpectedId(event.target.value)} /></label><label>Observed stable ID<input value={instagramObservedId} onChange={(event) => setInstagramObservedId(event.target.value)} /></label><label>Display label<input value={instagramLabel} onChange={(event) => setInstagramLabel(event.target.value)} /></label><label className={styles.checkbox}><input type="checkbox" checked={instagramOwnerConfirmed} onChange={(event) => setInstagramOwnerConfirmed(event.target.checked)} /> Owner account confirmation</label><strong>{publishPackage.platformPackages.find((entry) => entry.platformId === "instagram_reels")?.identityComparison.matchesForPlanning ? "PLANNING_MATCH" : "BLOCKED"}</strong></article>
        <article><h3>YouTube Shorts</h3><label>Expected stable ID<input value={youtubeExpectedId} onChange={(event) => setYoutubeExpectedId(event.target.value)} /></label><label>Observed stable ID<input value={youtubeObservedId} onChange={(event) => setYoutubeObservedId(event.target.value)} /></label><label>Display label<input value={youtubeLabel} onChange={(event) => setYoutubeLabel(event.target.value)} /></label><label className={styles.checkbox}><input type="checkbox" checked={youtubeOwnerConfirmed} onChange={(event) => setYoutubeOwnerConfirmed(event.target.checked)} /> Owner account confirmation</label><strong>{publishPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts")?.identityComparison.matchesForPlanning ? "PLANNING_MATCH" : "BLOCKED"}</strong></article>
      </div></section>

      <section className={styles.step}><h2><span>3</span> Metadata · Source Disclosure</h2><p className={styles.notice}>Detailed Script·Selected Angle·Evidence Pack에서만 구성한 internal planning policy입니다. 최신 플랫폼 제한과 source URL 존재는 외부 검증하지 않았습니다.</p><div className={styles.metadataGrid}>
        <article><h3>Instagram</h3><label>Hashtags<input value={instagramHashtags} onChange={(event) => setInstagramHashtags(event.target.value)} /></label><label>Cover scene<select value={instagramCoverSceneId} onChange={(event) => setInstagramCoverSceneId(event.target.value)}>{manifest.scenes.map((scene) => <option key={scene.sceneId}>{scene.sceneId}</option>)}</select></label><p>{metadata[0].caption}</p><code>{metadata[0].metadataHash}</code></article>
        <article><h3>YouTube</h3><label>Hashtags<input value={youtubeHashtags} onChange={(event) => setYoutubeHashtags(event.target.value)} /></label><label>Visibility<select value={youtubeVisibility} onChange={(event) => setYoutubeVisibility(event.target.value as PublishVisibilityIntent)}><option value="public">public</option><option value="unlisted">unlisted</option><option value="private">private</option></select></label><label>Cover scene<select value={youtubeCoverSceneId} onChange={(event) => setYoutubeCoverSceneId(event.target.value)}>{manifest.scenes.map((scene) => <option key={scene.sceneId}>{scene.sceneId}</option>)}</select></label><p>{metadata[1].description}</p><code>{metadata[1].metadataHash}</code></article>
      </div></section>

      <section className={styles.step}><h2><span>4</span> 실행 의도</h2><div className={styles.formGrid}><label>Intent<select value={executionIntent} onChange={(event) => setExecutionIntent(event.target.value as PublishExecutionIntent)}><option value="immediate_future">immediate future</option><option value="scheduled_future">scheduled future</option></select></label><label>Validation now ISO<input value={validationNowIso} onChange={(event) => setValidationNowIso(event.target.value)} /></label><label>Scheduled at ISO<input value={scheduledAtIso} disabled={executionIntent !== "scheduled_future"} onChange={(event) => setScheduledAtIso(event.target.value)} /></label><label>Timezone<input value={timezone} disabled={executionIntent !== "scheduled_future"} onChange={(event) => setTimezone(event.target.value)} /></label><label className={styles.checkbox}><input type="checkbox" checked={scheduleOwnerConfirmation} disabled={executionIntent !== "scheduled_future"} onChange={(event) => setScheduleOwnerConfirmation(event.target.checked)} /> Owner schedule intent confirmation</label></div><p className={styles.notice}>schedulerAvailable=false · executionReady=false · 실제 예약 실행 버튼 없음</p></section>

      <section className={styles.step}><h2><span>5</span> Duplicate · Session Ledger</h2><div className={styles.tableWrap}><table><thead><tr><th>Platform</th><th>Dedupe key</th><th>Latest</th><th>Dry run</th></tr></thead><tbody>{publishPackage.platformPackages.map((entry) => <tr key={entry.platformId}><td>{platformLabel(entry.platformId)}</td><td><code>{entry.dedupeKey.value}</code></td><td>{ledger.platformStates.find((state) => state.platformId === entry.platformId)?.latestStatus ?? "not_attempted"}</td><td>externalExecution=false</td></tr>)}</tbody></table></div><p>Session-only · durable ledger 없음 · remote duplicate 미확인</p><div className={styles.actions}><button type="button" disabled={ledger.attempts.length > 0 || publishPackage.platformPackages.length !== 2 || publishPackage.platformPackages.some((entry) => !entry.identityComparison.matchesForPlanning)} onClick={runSyntheticPartialFailure}>Synthetic partial-failure dry-run 기록</button><button type="button" disabled={!recoveryPlan.retryablePlatformIds.includes("youtube_shorts")} onClick={runSyntheticFailedPlatformRetry}>YouTube failed-only retry dry-run</button><button type="button" className={styles.secondary} onClick={() => setLedger(createEmptyLedger(sessionIdentity))}>Session ledger reset</button></div></section>

      <section className={styles.step}><h2><span>6</span> Recovery</h2><div className={styles.recoveryGrid}><article><h3>Successful</h3><strong>{recoveryPlan.successfulPlatformIds.join(", ") || "none"}</strong><p>재실행 금지·상태 보존</p></article><article><h3>Failed</h3><strong>{recoveryPlan.failedPlatformIds.join(", ") || "none"}</strong><p>retryable: {recoveryPlan.retryablePlatformIds.join(", ") || "none"}</p></article><article><h3>Blocked</h3><strong>{recoveryPlan.blockedPlatformIds.join(", ") || "none"}</strong><p>{recoveryPlan.requiredPlanChanges.join(" · ") || "plan change 없음"}</p></article></div><p>actual retry 실행 없음 · retry package는 failed platform만 포함</p></section>

      <section className={styles.step}><h2><span>7</span> Validation · Session Approval</h2><div className={styles.summaryGrid}><article><h3>Blocking</h3><strong>{validation.blockingIssueCount}</strong></article><article><h3>Warnings</h3><strong>{validation.warningCount}</strong></article><article><h3>Bridge</h3><strong>executionReady=false</strong><p>{bridgePlan.platformPlans.reduce((total, entry) => total + entry.unavailableCapabilities.length, 0)} unavailable capabilities</p></article></div><ul className={styles.issues}>{validation.issues.map((entry, index) => <li key={`${entry.code}:${entry.platformId}:${index}`} data-blocking={entry.blocking}>{entry.blocking ? "차단" : "경고"} · {entry.platformId ?? "global"} · {entry.message}</li>)}</ul><label className={styles.confirmation}><input type="checkbox" checked={actualPublishNotIncludedConfirmed} onChange={(event) => setActualPublishNotIncludedConfirmed(event.target.checked)} /> 이 승인은 session-only 계획 package이며 실제 계정 검증·upload·publish·schedule·durable ledger·execution eligibility가 아님을 확인합니다.</label><div className={styles.actions}><button type="button" disabled={!approvable} onClick={() => setApprovedPackageHash(currentPackageHash)}>Publish Integration Package 세션 승인</button><button type="button" className={styles.secondary} disabled={!approvedPackageHash} onClick={() => setApprovedPackageHash(null)}>승인 취소</button><button type="button" className={styles.secondary} onClick={resetPublishPlanning}>Slice 7 reset</button><strong>{approvalState}</strong></div><p role="status" className={approvalState === "approved" ? styles.success : styles.muted}>{approvalState === "approved" ? "SESSION_ONLY_APPROVED · upload/publication/scheduling 0" : approvalState === "invalidated" ? "Upstream·identity·metadata·schedule·ledger·recovery 변경으로 무효화됨" : "NOT_APPROVED"}</p></section>
    </main>
  );
}
