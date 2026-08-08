"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ApprovedPublishIntegrationSessionSnapshot,
  ApprovedRelaunchReadinessSessionSnapshot,
  RelaunchDirectionId,
  RelaunchValidationIssue,
} from "../../lib/editorial-v2/contracts";
import type { SampleRelaunchDraftState } from "../../lib/editorial-v2/draft-contracts";
import { buildLaunchReadinessChecklist, canRequestProductionActivation, summarizeLaunchReadiness } from "../../lib/editorial-v2/launch-checklist";
import {
  buildChannelDescriptionPackage,
  buildDefaultChannelSourceDisclosureStandard,
  buildPinnedRelaunchPostDraft,
  buildRelaunchAssetPlan,
  buildRelaunchDirectionCandidates,
  buildRelaunchPackage,
  cloneRelaunchPackage,
  createProvisionalChannelIdentityDraft,
} from "../../lib/editorial-v2/relaunch-package";
import { canApproveRelaunchReadiness, summarizeRelaunchValidation, validateProvisionalChannelIdentity, validateRelaunchAssetPlan } from "../../lib/editorial-v2/relaunch-validation";
import { buildRepresentativeSamplePackage, cloneRepresentativeSamplePackage } from "../../lib/editorial-v2/representative-sample";
import { canApproveRepresentativeSample, summarizeRepresentativeSampleReadiness, validateRepresentativeSampleReadiness } from "../../lib/editorial-v2/sample-readiness";
import RelaunchSvgPreview from "./RelaunchSvgPreview";
import styles from "./SampleRelaunchWorkbench.module.css";

interface SampleRelaunchWorkbenchProps {
  readonly approvedPublishIntegrationSnapshot: ApprovedPublishIntegrationSessionSnapshot;
  readonly onApprovedRelaunchReadinessChange?: (
    snapshot: ApprovedRelaunchReadinessSessionSnapshot | null,
  ) => void;
  readonly initialDraftState?: SampleRelaunchDraftState | null;
  readonly draftHydrationKey?: string;
  readonly onDraftStateChange?: (state: SampleRelaunchDraftState) => void;
}

const DIRECTION_IDS: readonly RelaunchDirectionId[] = [
  "evidence_signal_lab",
  "everyday_economy_lens",
  "hidden_connection_brief",
];

function blockingSummaryIssue(): RelaunchValidationIssue {
  return {
    code: "relaunch_direction_missing",
    fieldPath: "selectedDirectionId",
    message: "세 방향을 검토하고 provisional direction을 선택해야 합니다.",
    blocking: true,
  };
}

export default function SampleRelaunchWorkbench({
  approvedPublishIntegrationSnapshot,
  onApprovedRelaunchReadinessChange,
  initialDraftState = null,
  draftHydrationKey = "no-draft",
  onDraftStateChange,
}: SampleRelaunchWorkbenchProps) {
  const sourceRender = approvedPublishIntegrationSnapshot.sourceRenderIntegrationSnapshot;
  const sourceScript = sourceRender.sourceDetailedScriptSnapshot;
  const representativePackage = useMemo(
    () => buildRepresentativeSamplePackage(approvedPublishIntegrationSnapshot),
    [approvedPublishIntegrationSnapshot],
  );
  const representativeValidation = useMemo(
    () => summarizeRepresentativeSampleReadiness(validateRepresentativeSampleReadiness(representativePackage)),
    [representativePackage],
  );
  const directions = useMemo(() => buildRelaunchDirectionCandidates({
    primaryAudience: sourceScript.audience,
    sourceFirstRequired: true,
  }), [sourceScript.audience]);

  const [selectedDirectionId, setSelectedDirectionId] = useState<RelaunchDirectionId | "">(initialDraftState?.selectedDirectionId ?? "");
  const [reviewedDirectionIds, setReviewedDirectionIds] = useState<readonly RelaunchDirectionId[]>(initialDraftState?.reviewedDirectionIds ?? []);
  const [channelNameCandidate, setChannelNameCandidate] = useState(initialDraftState?.identityDraft.channelNameCandidate ?? "");
  const [handleCandidates, setHandleCandidates] = useState(initialDraftState?.identityDraft.handleCandidates ?? "");
  const [oneLinePromise, setOneLinePromise] = useState(initialDraftState?.identityDraft.oneLinePromise ?? "");
  const [primaryAudience, setPrimaryAudience] = useState(initialDraftState?.identityDraft.primaryAudience ?? sourceScript.audience);
  const [prohibitedWords, setProhibitedWords] = useState(initialDraftState?.identityDraft.prohibitedWords ?? "수익 보장, 성공 보장, 무조건 매수, 무조건 매도");
  const [tagline, setTagline] = useState(initialDraftState?.identityDraft.tagline ?? "");
  const [productionGapsAcknowledged, setProductionGapsAcknowledged] = useState(initialDraftState?.acknowledgementStates.productionGapsAcknowledged ?? false);
  const [controlTowerApprovalAcknowledged, setControlTowerApprovalAcknowledged] = useState(initialDraftState?.acknowledgementStates.controlTowerApprovalAcknowledged ?? false);
  const [approvedIdentity, setApprovedIdentity] = useState<string | null>(null);

  const selectedDirection = directions.find((direction) => direction.directionId === selectedDirectionId) ?? null;
  const allDirectionsReviewed = DIRECTION_IDS.every((directionId) => reviewedDirectionIds.includes(directionId));
  const identityDraft = useMemo(() => selectedDirection ? createProvisionalChannelIdentityDraft(selectedDirection, {
    channelDisplayNameCandidate: channelNameCandidate,
    handleCandidates: handleCandidates.split(",").map((handle) => ({ handle, platformIntent: "cross_platform" as const })),
    oneLinePromise,
    primaryAudience,
    preferredDirection: selectedDirection.temporaryDirectionLabel,
    prohibitedWords: prohibitedWords.split(","),
    optionalTagline: tagline || null,
  }) : null, [channelNameCandidate, handleCandidates, oneLinePromise, primaryAudience, prohibitedWords, selectedDirection, tagline]);
  const sourceStandard = useMemo(() => buildDefaultChannelSourceDisclosureStandard(), []);
  const descriptions = useMemo(() => identityDraft ? buildChannelDescriptionPackage(identityDraft, sourceStandard) : null, [identityDraft, sourceStandard]);
  const pinnedPost = useMemo(() => identityDraft ? buildPinnedRelaunchPostDraft(identityDraft) : null, [identityDraft]);
  const assetPlan = useMemo(() => identityDraft ? buildRelaunchAssetPlan(identityDraft, approvedPublishIntegrationSnapshot.selectedCharacterDirectionId) : null, [approvedPublishIntegrationSnapshot.selectedCharacterDirectionId, identityDraft]);
  const relaunchPackage = useMemo(() => identityDraft && descriptions && pinnedPost && assetPlan && selectedDirection ? buildRelaunchPackage(
    directions,
    selectedDirection.directionId,
    identityDraft,
    descriptions,
    pinnedPost,
    assetPlan,
  ) : null, [assetPlan, descriptions, directions, identityDraft, pinnedPost, selectedDirection]);
  const relaunchValidation = useMemo(() => {
    if (!identityDraft || !assetPlan || !selectedDirection || !descriptions) {
      return summarizeRelaunchValidation([blockingSummaryIssue()]);
    }
    return summarizeRelaunchValidation([
      ...validateProvisionalChannelIdentity(identityDraft, {
        selectedDirection,
        descriptions,
        allDirectionsReviewed,
        characterOriginalityStatePresent: assetPlan.characterOriginalityState === "owned_original_planning_evidence",
        rightsStateResolvedForPlanning: assetPlan.rightsState === "planning_review_only",
        controlTowerFinalApprovalRequired: true,
      }),
      ...validateRelaunchAssetPlan(assetPlan, identityDraft),
    ]);
  }, [allDirectionsReviewed, assetPlan, descriptions, identityDraft, selectedDirection]);
  const launchChecklist = useMemo(() => buildLaunchReadinessChecklist({
    representativeValidation,
    relaunchValidation,
    selectedProvisionalDirection: selectedDirection !== null,
    allDirectionsReviewed,
    actualProductionGapsAcknowledged: productionGapsAcknowledged,
    controlTowerFinalApprovalAcknowledged: controlTowerApprovalAcknowledged,
  }), [allDirectionsReviewed, controlTowerApprovalAcknowledged, productionGapsAcknowledged, relaunchValidation, representativeValidation, selectedDirection]);
  const launchReadiness = useMemo(() => summarizeLaunchReadiness(launchChecklist), [launchChecklist]);
  const currentApprovalIdentity = `${representativePackage.packageId}:${relaunchPackage?.packageId ?? "no-relaunch"}:${reviewedDirectionIds.slice().sort().join("|")}:${productionGapsAcknowledged}:${controlTowerApprovalAcknowledged}`;
  const approvalState = approvedIdentity === currentApprovalIdentity ? "provisionally_approved" : approvedIdentity ? "invalidated" : "not_approved";
  const approvalReady = canApproveRepresentativeSample(representativeValidation)
    && canApproveRelaunchReadiness(relaunchValidation)
    && canRequestProductionActivation(launchReadiness)
    && allDirectionsReviewed
    && selectedDirection !== null
    && relaunchPackage !== null
    && productionGapsAcknowledged
    && controlTowerApprovalAcknowledged;

  useEffect(() => {
    if (!onApprovedRelaunchReadinessChange) return;
    if (approvalState !== "provisionally_approved" || !approvalReady || !selectedDirection || !relaunchPackage) {
      onApprovedRelaunchReadinessChange(null);
      return;
    }
    onApprovedRelaunchReadinessChange({
      sourcePublishIntegrationIdentity: representativePackage.provenance.publishIntegrationIdentity,
      representativePackage: cloneRepresentativeSamplePackage(representativePackage),
      representativeValidation: { ...representativeValidation, issues: representativeValidation.issues.map((issue) => ({ ...issue })) },
      relaunchPackage: cloneRelaunchPackage(relaunchPackage),
      relaunchValidation: { ...relaunchValidation, issues: relaunchValidation.issues.map((issue) => ({ ...issue })) },
      launchChecklist: launchChecklist.map((entry) => ({ ...entry, evidence: [...entry.evidence] })),
      launchReadiness: { ...launchReadiness, categoryCounts: launchReadiness.categoryCounts.map((entry) => ({ ...entry })) },
      selectedDirectionId: selectedDirection.directionId,
      allDirectionsReviewed: true,
      actualProductionGapsAcknowledged: true,
      controlTowerFinalApprovalAcknowledged: true,
      approvalState: "provisionally_approved",
      sessionOnly: true,
      finalBrandApproved: false,
      actualAccountChanged: false,
      actualAssetsCreated: false,
      publicLaunchApproved: false,
      publicLaunchReady: false,
    });
    return () => onApprovedRelaunchReadinessChange(null);
  }, [approvalReady, approvalState, launchChecklist, launchReadiness, onApprovedRelaunchReadinessChange, relaunchPackage, relaunchValidation, representativePackage, representativeValidation, selectedDirection]);

  useEffect(() => {
    onDraftStateChange?.({
      stageId: "relaunch_readiness",
      approvalAuthority: "non_canonical_draft",
      approvalLikeState: approvedIdentity ? "pending_reconfirmation" : "not_approved",
      selectedDirectionId,
      reviewedDirectionIds: [...reviewedDirectionIds],
      identityDraft: { channelNameCandidate, handleCandidates, oneLinePromise, primaryAudience, prohibitedWords, tagline },
      acknowledgementStates: { productionGapsAcknowledged, controlTowerApprovalAcknowledged },
      approvedIdentity,
    });
  }, [approvedIdentity, channelNameCandidate, controlTowerApprovalAcknowledged, draftHydrationKey, handleCandidates, onDraftStateChange, oneLinePromise, primaryAudience, productionGapsAcknowledged, prohibitedWords, reviewedDirectionIds, selectedDirectionId, tagline]);

  function toggleDirectionReviewed(directionId: RelaunchDirectionId): void {
    setReviewedDirectionIds((current) => current.includes(directionId)
      ? current.filter((entry) => entry !== directionId)
      : [...current, directionId]);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Shorts Editorial OS V2 · Slice 8</p>
        <h1>Representative Sample · Relaunch Readiness</h1>
        <p>Synthetic local proof와 provisional brand draft만 다룹니다. 실제 production video, account change, OAuth, upload, publish, schedule, persistence는 없습니다.</p>
      </header>

      <section className={styles.step}>
        <h2><span>1</span> End-to-end Summary</h2>
        <div className={styles.summaryGrid}>
          {Object.entries(representativePackage.provenance).map(([label, value]) => <article key={label}><small>{label}</small><code>{Array.isArray(value) ? value.join(" · ") : value}</code></article>)}
        </div>
        <p className={styles.notice}>Slice 0~7 provenance 연결 · 8 scene · synthetic-only · unresolved assets {representativePackage.unresolvedRequirements.length}개 · production/public ready=false</p>
      </section>

      <section className={styles.step}>
        <h2><span>2</span> Representative Storyboard</h2>
        <div className={styles.sceneGrid}>
          {representativePackage.storyboard.scenes.map((scene) => <article key={scene.sceneId} className={styles.sceneCard}>
            <header><span>{scene.sceneOrder}</span><strong>{scene.beatType}</strong></header>
            <h3>{scene.keyCaption}</h3><p>{scene.narration}</p>
            <dl><dt>Evidence</dt><dd>{scene.evidenceRefs.join(", ") || "MISSING"}</dd><dt>Visual</dt><dd>{scene.primaryVisualStrategy} + {scene.secondaryVisualStrategies.join(", ") || "none"}</dd><dt>Character</dt><dd>{scene.characterMotion?.motionTag ?? "none"}</dd><dt>Subtitle</dt><dd>{scene.subtitleCueSummary}</dd><dt>Cover</dt><dd>{scene.publishCoverCandidate ? "candidate" : "no"}</dd><dt>Rights · cost</dt><dd>{scene.rightsState} · {scene.costState}</dd></dl>
            <p className={styles.blocked}>Actual asset 없음 · {scene.safeAreaState} · production-ready 아님</p>
          </article>)}
        </div>
        <p>Representative validation: blocking {representativeValidation.blockingIssueCount} / warnings {representativeValidation.warningCount}</p>
      </section>

      <section className={styles.step}>
        <h2><span>3</span> Relaunch Directions</h2>
        <div className={styles.directionGrid}>{directions.map((direction) => <article key={direction.directionId} data-selected={selectedDirectionId === direction.directionId}>
          <label className={styles.radio}><input type="radio" name="direction" checked={selectedDirectionId === direction.directionId} onChange={() => setSelectedDirectionId(direction.directionId)} /> provisional direction 선택</label>
          <h3>{direction.temporaryDirectionLabel}</h3><p>{direction.channelPromise}</p><p><strong>Audience:</strong> {direction.audienceEmphasis}</p><p><strong>Tone:</strong> {direction.tone}</p><p><strong>Risk:</strong> {direction.similarityRisk}</p>
          <label className={styles.checkbox}><input type="checkbox" checked={reviewedDirectionIds.includes(direction.directionId)} onChange={() => toggleDirectionReviewed(direction.directionId)} /> 이 방향의 promise·audience·tone·risk를 검토함</label>
          <small>provisional-only · final Owner approval required</small>
        </article>)}</div>
      </section>

      <section className={styles.step}>
        <h2><span>4</span> Channel Identity Draft</h2>
        <div className={styles.formGrid}>
          <label>Channel display name candidate<input value={channelNameCandidate} onChange={(event) => setChannelNameCandidate(event.target.value)} placeholder="최종명이 아닌 임시 후보" /></label>
          <label>Handle candidates, comma-separated<input value={handleCandidates} onChange={(event) => setHandleCandidates(event.target.value)} placeholder="availability 미검증" /></label>
          <label>One-line promise<input value={oneLinePromise} onChange={(event) => setOneLinePromise(event.target.value)} /></label>
          <label>Primary audience<input value={primaryAudience} onChange={(event) => setPrimaryAudience(event.target.value)} /></label>
          <label>Prohibited words<input value={prohibitedWords} onChange={(event) => setProhibitedWords(event.target.value)} /></label>
          <label>Optional tagline<input value={tagline} onChange={(event) => setTagline(event.target.value)} /></label>
        </div>
        {descriptions ? <div className={styles.copyGrid}><article><h3>Instagram bio</h3><p>{descriptions.instagramBioDraft}</p></article><article><h3>YouTube short description</h3><p>{descriptions.youtubeShortDescription}</p></article><article><h3>YouTube full description</h3><p>{descriptions.youtubeFullDescription}</p></article><article><h3>Standards</h3><p>{descriptions.sourceStandard.shortStatement}</p><p>{descriptions.financialSafetyStandard.statement}</p></article></div> : <p className={styles.notice}>먼저 provisional direction을 선택하세요.</p>}
      </section>

      <section className={styles.step}>
        <h2><span>5</span> Asset Preview</h2>
        {identityDraft && assetPlan ? <RelaunchSvgPreview identityDraft={identityDraft} assetPlan={assetPlan} /> : <p className={styles.notice}>Identity draft가 있어야 SVG preview를 표시합니다.</p>}
        <p>Internal SVG primitives only · 실제 logo/profile/cover production asset 아님 · 타사 logo·외부 font/image 없음</p>
      </section>

      <section className={styles.step}>
        <h2><span>6</span> Pinned Relaunch Post</h2>
        {pinnedPost ? <article className={styles.pinned}><h3>{pinnedPost.headline}</h3><p>{pinnedPost.contentPromise}</p><p>{pinnedPost.sourceCommitment}</p><p>{pinnedPost.financialSafetyStatement}</p><ul>{pinnedPost.firstContentPillars.map((pillar) => <li key={pillar}>{pillar}</li>)}</ul><small>성과 주장 없음 · public post 생성 아님</small></article> : <p className={styles.notice}>선택된 direction이 없습니다.</p>}
      </section>

      <section className={styles.step}>
        <h2><span>7</span> Launch Readiness</h2>
        <div className={styles.readinessSummary}><strong>Blocking {launchReadiness.blockingCount}</strong><strong>Not verified {launchReadiness.notVerifiedCount}</strong><strong>Production Activation request {launchReadiness.canRequestProductionActivation ? "READY" : "BLOCKED"}</strong><strong>publicLaunchReady=false</strong></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Category</th><th>Item</th><th>Status</th><th>Responsible</th><th>Required action</th></tr></thead><tbody>{launchChecklist.map((entry) => <tr key={entry.itemId} data-blocking={entry.blocking}><td>{entry.category}</td><td>{entry.label}</td><td>{entry.status}</td><td>{entry.responsibleRole}</td><td>{entry.requiredAction}{entry.externalActionRequired ? " · external approval/action" : ""}</td></tr>)}</tbody></table></div>
      </section>

      <section className={styles.step}>
        <h2><span>8</span> Provisional Approval</h2>
        <p>Representative blocking {representativeValidation.blockingIssueCount} · Relaunch blocking {relaunchValidation.blockingIssueCount} · three directions reviewed {allDirectionsReviewed ? "YES" : "NO"}</p>
        <ul className={styles.issueList}>{[...representativeValidation.issues, ...relaunchValidation.issues].map((issue, index) => <li key={`${issue.code}:${index}`} data-blocking={issue.blocking}>{issue.blocking ? "차단" : "경고"} · {issue.code} · {issue.message}</li>)}</ul>
        <label className={styles.checkbox}><input type="checkbox" checked={productionGapsAcknowledged} onChange={(event) => setProductionGapsAcknowledged(event.target.checked)} /> 실제 TTS·asset·production render·account/OAuth·persistence·publish 등 Production Activation gaps를 확인했습니다.</label>
        <label className={styles.checkbox}><input type="checkbox" checked={controlTowerApprovalAcknowledged} onChange={(event) => setControlTowerApprovalAcknowledged(event.target.checked)} /> 이 결과는 final brand·actual account change·public launch 승인이 아니며 다음 범위는 ChatGPT Control Tower 승인이 필요함을 확인합니다.</label>
        <div className={styles.actions}><button type="button" disabled={!approvalReady} onClick={() => setApprovedIdentity(currentApprovalIdentity)}>Relaunch Readiness 세션 승인</button><button type="button" className={styles.secondary} disabled={!approvedIdentity} onClick={() => setApprovedIdentity(null)}>승인 취소</button></div>
        <p role="status" className={approvalState === "provisionally_approved" ? styles.success : styles.notice}>{approvalState} · session-only · publicLaunchReady=false</p>
      </section>
    </main>
  );
}
