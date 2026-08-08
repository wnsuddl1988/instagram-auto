"use client";

import { useEffect, useReducer, useState } from "react";

import type {
  ApprovedDetailedScriptSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  AssetAcquisitionMode,
  CharacterMotionTag,
  RightsReviewState,
  SceneCardDraft,
  SceneVisualPlan,
  VisualStrategyType,
} from "../../lib/editorial-v2/contracts";
import type { ScenePlanningDraftState } from "../../lib/editorial-v2/draft-contracts";
import {
  canApproveScenePlanning,
  createInitialScenePlanningSession,
  reduceScenePlanningSession,
} from "../../lib/editorial-v2/planning-session";
import { canApproveSceneCards, validateSceneCardDrafts } from "../../lib/editorial-v2/scene-card-validation";
import { buildSceneCardDrafts } from "../../lib/editorial-v2/scene-cards";
import {
  type SceneOverrideResult,
  changeAcquisitionMode,
  editGenerationPromptDraft,
  editSceneKeyCaption,
  editSceneNarration,
  editSceneRetentionBeat,
  editSceneVisualizationType,
  overridePrimaryStrategy,
  overrideSecondaryStrategies,
  replaceSceneCameraMotion,
  replaceSceneCharacterMotion,
  replaceSceneSoundEffect,
  replaceSceneTransition,
  resetOneSceneToDeterministicDefault,
  setDirectUploadRequired,
  setVisualOwnerApproval,
  setVisualRightsReviewState,
  toggleSceneEnabled,
} from "../../lib/editorial-v2/scene-overrides";
import {
  buildVisualAssetPlan,
  EVIDENCE_FIRST_VISUAL_STRATEGIES,
  SUPPORTING_VISUAL_STRATEGIES,
  validateVisualAssetPlan,
} from "../../lib/editorial-v2/visual-planning";
import styles from "./ScenePlanningWorkbench.module.css";

interface ScenePlanningWorkbenchProps {
  readonly approvedScriptSnapshot: ApprovedDetailedScriptSessionSnapshot;
  readonly onApprovedScenePlanningChange?: (
    snapshot: ApprovedScenePlanningSessionSnapshot | null,
  ) => void;
  readonly initialDraftState?: ScenePlanningDraftState | null;
  readonly draftHydrationKey?: string;
  readonly onDraftStateChange?: (state: ScenePlanningDraftState) => void;
}

function cloneVisualPlan(plan: readonly SceneVisualPlan[]): readonly SceneVisualPlan[] {
  return plan.map((entry) => ({
    ...entry,
    sceneRevision: { ...entry.sceneRevision },
    secondaryStrategies: [...entry.secondaryStrategies],
    evidenceRefs: [...entry.evidenceRefs],
    sourceRefs: [...entry.sourceRefs],
    numberRefs: [...entry.numberRefs],
    chartPlan: entry.chartPlan ? { ...entry.chartPlan, numberRefs: [...entry.chartPlan.numberRefs], labels: [...entry.chartPlan.labels] } : null,
    sourceCardPlan: entry.sourceCardPlan ? { ...entry.sourceCardPlan, sourceRefs: [...entry.sourceCardPlan.sourceRefs], publisherLabels: [...entry.sourceCardPlan.publisherLabels] } : null,
    timelinePlan: entry.timelinePlan ? { entries: entry.timelinePlan.entries.map((item) => ({ ...item })) } : null,
    relationshipDiagramPlan: entry.relationshipDiagramPlan ? { ...entry.relationshipDiagramPlan, labels: [...entry.relationshipDiagramPlan.labels], evidenceRefs: [...entry.relationshipDiagramPlan.evidenceRefs] } : null,
    generatedImagePlan: entry.generatedImagePlan ? { ...entry.generatedImagePlan } : null,
    generatedVideoPlan: entry.generatedVideoPlan ? { ...entry.generatedVideoPlan } : null,
    stockVideoPlan: entry.stockVideoPlan ? { ...entry.stockVideoPlan } : null,
    directUploadPlan: entry.directUploadPlan ? { ...entry.directUploadPlan } : null,
    warnings: [...entry.warnings],
    blockingIssues: [...entry.blockingIssues],
  }));
}

const VISUAL_STRATEGIES: readonly VisualStrategyType[] = [
  ...EVIDENCE_FIRST_VISUAL_STRATEGIES,
  ...SUPPORTING_VISUAL_STRATEGIES,
];
const CHARACTER_MOTIONS: readonly CharacterMotionTag[] = ["none", "point_to_source", "highlight_number", "trace_relationship", "watch_timeline"];
const CAMERA_MOTIONS = ["screen_push_in", "split_screen_reveal", "data_focus_hold", "diagram_trace", "caption_focus_hold", "before_after_wipe", "checklist_step_down", "timeline_pan"] as const;
const TRANSITIONS = ["hard_cut", "contrast_wipe", "data_snap", "line_trace", "soft_push", "correction_flip", "checklist_tick", "signal_fade"] as const;
const SOUND_EFFECTS = ["soft_alert", "contrast_click", "data_tick", "line_draw", "soft_emphasis", "correction_click", "check_tick", "watch_ping"] as const;
const ACQUISITION_MODES: readonly AssetAcquisitionMode[] = ["deterministic_overlay", "manual_ai_image", "manual_ai_video", "manual_stock", "direct_upload_required"];
const RIGHTS_STATES: readonly RightsReviewState[] = ["pending_manual_review", "reviewed_for_planning"];

export default function ScenePlanningWorkbench({
  approvedScriptSnapshot,
  onApprovedScenePlanningChange,
  initialDraftState = null,
  draftHydrationKey = "no-draft",
  onDraftStateChange,
}: ScenePlanningWorkbenchProps) {
  const initialSession = initialDraftState ? {
    ...initialDraftState.session,
    approvedScript: approvedScriptSnapshot,
    sceneCardApproval: initialDraftState.session.sceneCardApproval === "approved" ? "invalidated" as const : initialDraftState.session.sceneCardApproval,
    planningApproval: initialDraftState.session.planningApproval === "approved" ? "invalidated" as const : initialDraftState.session.planningApproval,
  } : createInitialScenePlanningSession(approvedScriptSnapshot);
  const [session, dispatch] = useReducer(
    reduceScenePlanningSession,
    initialSession,
  );
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(initialDraftState?.selectedSceneId ?? null);

  useEffect(() => {
    if (!onApprovedScenePlanningChange) return;
    if (
      session.planningApproval !== "approved"
      || !session.sceneValidation
      || !session.visualProof
      || !canApproveScenePlanning(session)
    ) {
      onApprovedScenePlanningChange(null);
      return;
    }
    onApprovedScenePlanningChange({
      approvedScriptIdentity: approvedScriptSnapshot.scriptNormalizedHash,
      approvedScriptRawHash: approvedScriptSnapshot.scriptRawHash,
      approvedScriptNormalizedHash: approvedScriptSnapshot.scriptNormalizedHash,
      evidenceIdentity: approvedScriptSnapshot.evidenceIdentity,
      selectedAngleId: approvedScriptSnapshot.selectedAngle.selectedAngleId,
      sceneCards: session.sceneCards.map((scene) => ({
        ...scene,
        evidenceRefs: [...scene.evidenceRefs],
        sourceRefs: [...scene.sourceRefs],
        provenance: {
          ...scene.provenance,
          claimRefs: [...scene.provenance.claimRefs],
          numberRefs: [...scene.provenance.numberRefs],
          sourceRefs: [...scene.provenance.sourceRefs],
          sceneRevision: { ...scene.provenance.sceneRevision },
        },
      })),
      sceneValidation: {
        ...session.sceneValidation,
        issues: session.sceneValidation.issues.map((entry) => ({ ...entry })),
      },
      visualPlan: cloneVisualPlan(session.visualPlan),
      visualProof: {
        ...session.visualProof,
        issues: session.visualProof.issues.map((entry) => ({ ...entry })),
      },
      approvalState: "approved",
    });
  }, [approvedScriptSnapshot, onApprovedScenePlanningChange, session]);

  useEffect(() => {
    onDraftStateChange?.({
      stageId: "scene_planning",
      approvalAuthority: "non_canonical_draft",
      approvalLikeState: session.planningApproval === "approved" ? "pending_reconfirmation" : session.planningApproval,
      session: { ...session, approvedScript: approvedScriptSnapshot },
      selectedSceneId,
    });
  }, [approvedScriptSnapshot, draftHydrationKey, onDraftStateChange, selectedSceneId, session]);

  function generateSceneCards(): void {
    const sceneCards = buildSceneCardDrafts(approvedScriptSnapshot);
    const validation = validateSceneCardDrafts(sceneCards, approvedScriptSnapshot);
    dispatch({ type: "scene_cards_regenerated", sceneCards, validation });
  }

  function updateCards(sceneCards: readonly SceneCardDraft[]): void {
    dispatch({
      type: "scene_cards_changed",
      sceneCards,
      validation: validateSceneCardDrafts(sceneCards, approvedScriptSnapshot),
    });
  }

  function generateVisualPlan(): void {
    if (session.sceneCards.length === 0) return;
    const visualPlan = buildVisualAssetPlan(session.sceneCards, approvedScriptSnapshot);
    dispatch({
      type: "visual_plan_generated",
      visualPlan,
      visualProof: validateVisualAssetPlan(visualPlan, session.sceneCards, approvedScriptSnapshot),
    });
  }

  function applyVisualOverride(result: SceneOverrideResult): void {
    dispatch({
      type: "visual_plan_changed",
      sceneCards: result.sceneCards,
      sceneValidation: validateSceneCardDrafts(result.sceneCards, approvedScriptSnapshot),
      visualPlan: result.visualPlan,
      visualProof: validateVisualAssetPlan(result.visualPlan, result.sceneCards, approvedScriptSnapshot),
    });
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Shorts Editorial OS V2 · Slice 4</p>
        <h1>Scene Cards · Visual Planning</h1>
        <p>승인된 8-beat script를 session-only 계획으로 변환합니다. 실제 이미지·영상·업로드·렌더는 실행하지 않습니다.</p>
      </header>

      <section className={styles.step} aria-labelledby="planning-scenes">
        <h2 id="planning-scenes"><span>1</span> Scene Cards</h2>
        <div className={styles.actions}>
          <button type="button" onClick={generateSceneCards}>8개 Scene Card 초안 생성</button>
          <small>원본 beat order와 provenance를 1:1로 유지합니다.</small>
        </div>
        <div className={styles.sceneGrid}>{session.sceneCards.map((scene) => (
          <article className={styles.sceneCard} key={scene.sceneId} aria-current={selectedSceneId === scene.sceneId ? "true" : undefined} onClick={() => setSelectedSceneId(scene.sceneId)}>
            <div className={styles.sceneHeading}>
              <div><p className={styles.tag}>Scene {scene.order} · {scene.provenance.beatType}</p><h3>{scene.purpose}</h3></div>
              <label className={styles.inlineControl}>활성<input type="checkbox" checked={scene.enabled} onChange={() => updateCards(toggleSceneEnabled(session.sceneCards, scene.sceneId))} /></label>
            </div>
            <label>내레이션<textarea value={scene.narration} onChange={(event) => updateCards(editSceneNarration(session.sceneCards, scene.sceneId, event.target.value))} /></label>
            <label>핵심 캡션<input value={scene.keyCaption} onChange={(event) => updateCards(editSceneKeyCaption(session.sceneCards, scene.sceneId, event.target.value))} /></label>
            <label>Retention beat<input value={scene.retentionBeat} onChange={(event) => updateCards(editSceneRetentionBeat(session.sceneCards, scene.sceneId, event.target.value))} /></label>
            <div className={styles.controlGrid}>
              <label>Visualization<select value={scene.visualizationType} onChange={(event) => updateCards(editSceneVisualizationType(session.sceneCards, scene.sceneId, event.target.value))}>{EVIDENCE_FIRST_VISUAL_STRATEGIES.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
              <label>Character motion<select value={scene.characterMotion} onChange={(event) => updateCards(replaceSceneCharacterMotion(session.sceneCards, scene.sceneId, event.target.value as CharacterMotionTag))}>{CHARACTER_MOTIONS.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
              <label>Camera<select value={scene.cameraOrScreenMotion} onChange={(event) => updateCards(replaceSceneCameraMotion(session.sceneCards, scene.sceneId, event.target.value))}>{CAMERA_MOTIONS.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
              <label>Transition<select value={scene.transition} onChange={(event) => updateCards(replaceSceneTransition(session.sceneCards, scene.sceneId, event.target.value))}>{TRANSITIONS.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
              <label>Sound<select value={scene.soundEffect} onChange={(event) => updateCards(replaceSceneSoundEffect(session.sceneCards, scene.sceneId, event.target.value))}>{SOUND_EFFECTS.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
            </div>
            <details><summary>읽기 전용 provenance</summary><dl className={styles.provenance}><div><dt>Scene ID</dt><dd>{scene.sceneId}</dd></div><div><dt>Beat ID</dt><dd>{scene.provenance.beatId}</dd></div><div><dt>Revision</dt><dd>{scene.provenance.sceneRevision.value}</dd></div><div><dt>Evidence</dt><dd>{scene.evidenceRefs.join(", ") || "없음"}</dd></div><div><dt>Sources</dt><dd>{scene.sourceRefs.join(", ")}</dd></div><div><dt>Claims</dt><dd>{scene.provenance.claimRefs.join(", ") || "없음"}</dd></div><div><dt>Numbers</dt><dd>{scene.provenance.numberRefs.join(", ") || "없음"}</dd></div></dl></details>
          </article>
        ))}</div>
        {session.sceneValidation && <><p>활성 {session.sceneValidation.enabledSceneCount} · Blocking {session.sceneValidation.blockingIssueCount} · Warning {session.sceneValidation.warningCount}</p><ul className={styles.issues}>{session.sceneValidation.issues.map((issue, index) => <li key={`${issue.code}:${issue.sceneId}:${index}`} data-kind={issue.blocking ? "error" : "warning"}>{issue.blocking ? "차단" : "경고"} · {issue.sceneId ?? "전체"} · {issue.message}</li>)}</ul></>}
        <div className={styles.actions}><button type="button" onClick={() => dispatch({ type: "scene_cards_approved" })} disabled={!canApproveSceneCards(session.sceneValidation)}>Scene Cards 사용자 승인</button><button type="button" className={styles.secondary} onClick={() => dispatch({ type: "scene_cards_approval_cancelled" })} disabled={session.sceneCardApproval !== "approved"}>Scene 승인 취소</button><strong>{session.sceneCardApproval}</strong></div>
      </section>

      <section className={styles.step} aria-labelledby="planning-visuals">
        <h2 id="planning-visuals"><span>2</span> Visual Plan</h2>
        <div className={styles.actions}><button type="button" onClick={generateVisualPlan} disabled={session.sceneCards.length === 0 || !session.sceneValidation?.valid}>Deterministic Visual Asset Plan 생성</button><small>evidence-first 우선 · AI/stock/direct upload는 manual-only</small></div>
        <div className={styles.planGrid}>{session.visualPlan.map((visual) => {
          const scene = session.sceneCards.find((entry) => entry.sceneId === visual.sceneId);
          const characterSecondary = visual.secondaryStrategies.includes("character_motion");
          return <article className={styles.planCard} key={visual.sceneId}>
            <p className={styles.tag}>Scene {scene?.order} · {visual.visualProofClass}</p>
            <label>Primary strategy<select value={visual.primaryStrategy} onChange={(event) => applyVisualOverride(overridePrimaryStrategy(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId, event.target.value as VisualStrategyType))}>{VISUAL_STRATEGIES.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
            <label className={styles.inlineControl}>Character secondary<input type="checkbox" checked={characterSecondary} onChange={() => applyVisualOverride(overrideSecondaryStrategies(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId, characterSecondary ? [] : ["character_motion"]))} /></label>
            <label>Acquisition mode<select value={visual.acquisitionMode} onChange={(event) => applyVisualOverride(changeAcquisitionMode(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId, event.target.value as AssetAcquisitionMode))}>{ACQUISITION_MODES.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
            <dl className={styles.provenance}><div><dt>Class</dt><dd>{visual.primaryStrategyClass}</dd></div><div><dt>Cost</dt><dd>{visual.costClass}</dd></div><div><dt>Owner approval</dt><dd>{visual.requiresOwnerApproval ? "필요" : "불필요"}</dd></div><div><dt>Rights</dt><dd>{visual.rightsReviewState}</dd></div><div><dt>Source refs</dt><dd>{visual.sourceRefs.join(", ") || "없음"}</dd></div><div><dt>Number refs</dt><dd>{visual.numberRefs.join(", ") || "없음"}</dd></div></dl>
            {visual.requiresOwnerApproval && <div className={styles.reviewBox}><label>Rights structural review<select value={visual.rightsReviewState} onChange={(event) => applyVisualOverride(setVisualRightsReviewState(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId, event.target.value as RightsReviewState))}>{RIGHTS_STATES.map((entry) => <option key={entry}>{entry}</option>)}</select></label><label className={styles.inlineControl}>비용 가능 계획 Owner 확인<input type="checkbox" checked={visual.ownerApprovalConfirmed} onChange={(event) => applyVisualOverride(setVisualOwnerApproval(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId, event.target.checked))} /></label></div>}
          </article>;
        })}</div>
      </section>

      <section className={styles.step} aria-labelledby="planning-controls">
        <h2 id="planning-controls"><span>3</span> Scene-specific controls</h2>
        <p className={styles.notice}>실제 자산 생성·파일 업로드·장면별 재렌더는 아직 지원하지 않습니다. direct_upload는 향후 자산 필요 메타데이터입니다.</p>
        <div className={styles.planGrid}>{session.visualPlan.map((visual) => {
          const scene = session.sceneCards.find((entry) => entry.sceneId === visual.sceneId);
          return <article className={styles.planCard} key={`control:${visual.sceneId}`}><h3>Scene {scene?.order}</h3>
            {(visual.primaryStrategy === "generated_image" || visual.primaryStrategy === "generated_video") && <label>AI prompt draft<textarea value={visual.generationPromptDraft ?? ""} onChange={(event) => applyVisualOverride(editGenerationPromptDraft(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId, event.target.value))} /></label>}
            <label>Character motion<select value={scene?.characterMotion ?? "none"} onChange={(event) => updateCards(replaceSceneCharacterMotion(session.sceneCards, visual.sceneId, event.target.value as CharacterMotionTag))}>{CHARACTER_MOTIONS.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
            <label className={styles.inlineControl}>Direct upload required<input type="checkbox" checked={visual.primaryStrategy === "direct_upload"} onChange={(event) => applyVisualOverride(setDirectUploadRequired(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId, event.target.checked))} /></label>
            <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => applyVisualOverride(resetOneSceneToDeterministicDefault(session.sceneCards, session.visualPlan, approvedScriptSnapshot, visual.sceneId))}>이 장면 deterministic reset</button>{scene && <button type="button" className={styles.secondary} onClick={() => updateCards(toggleSceneEnabled(session.sceneCards, scene.sceneId))}>{scene.enabled ? "장면 비활성화" : "장면 활성화"}</button>}</div>
          </article>;
        })}</div>
      </section>

      <section className={styles.step} aria-labelledby="planning-approval">
        <h2 id="planning-approval"><span>4</span> Validation and Approval</h2>
        <div className={styles.summaryGrid}><article><h3>Scene Card validation</h3><strong>{session.sceneValidation?.blockingIssueCount ?? "-"} blocking</strong><p>{session.sceneCardApproval}</p></article><article><h3>Visual Proof</h3><strong>{session.visualProof?.blockingIssueCount ?? "-"} blocking</strong><p>{session.visualProof?.verificationLevel ?? "미검증"}</p></article><article><h3>Rights · Cost</h3><strong>{session.visualPlan.filter((entry) => entry.requiresOwnerApproval).length} manual plans</strong><p>실제 가격·권리 PASS가 아닌 구조 검토입니다.</p></article></div>
        {session.visualProof && <ul className={styles.issues}>{session.visualProof.issues.map((issue, index) => <li key={`${issue.code}:${issue.sceneId}:${index}`} data-kind={issue.blocking ? "error" : "warning"}>{issue.blocking ? "차단" : "경고"} · {issue.sceneId ?? "전체"} · {issue.message}</li>)}</ul>}
        <div className={styles.actions}><button type="button" onClick={() => dispatch({ type: "planning_approved" })} disabled={!canApproveScenePlanning(session)}>Scene and Visual Planning 사용자 승인</button><button type="button" className={styles.secondary} onClick={() => dispatch({ type: "planning_approval_cancelled" })} disabled={session.planningApproval !== "approved"}>Planning 승인 취소</button><button type="button" className={styles.secondary} onClick={() => dispatch({ type: "reset_all" })}>Slice 4 reset all</button></div>
        <p className={session.planningApproval === "approved" ? styles.success : styles.muted} role="status">{session.planningApproval === "approved" ? "세션 승인, 저장되지 않음" : session.planningApproval === "invalidated" ? "변경으로 planning 승인이 무효화됐습니다." : "승인되지 않음"}</p>
        <p className={styles.notice}>실제 자산·렌더는 생성되지 않음 · 다음 Slice 전까지 Scene Cards와 Visual Plan만 승인됨 · Slice 5는 구현되지 않았습니다.</p>
      </section>
    </main>
  );
}
